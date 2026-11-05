"""Live sign recognition route processing video frames via MediaPipe and Random Forest."""
import logging
from flask import Blueprint, request, jsonify
from services.image_utils import (
    decode_base64_image,
    PayloadTooLargeError,
    InvalidImageError
)
from services.hand_detector import HandDetector
from services.feature_extractor import FeatureExtractor
from services.classifier import SignClassifier

predict_bp = Blueprint("predict_bp", __name__)
logger = logging.getLogger(__name__)

# Initialize single reusable service instances at startup
# static_image_mode=False for live video-style tracking
_detector = HandDetector(static_image_mode=False)
_extractor = FeatureExtractor()
_classifier = SignClassifier()


@predict_bp.route("/api/predict", methods=["POST"])
def predict():
    """
    Receives a webcam frame, runs hand detection, extracts normalized features,
    and classifies the ISL sign (A, B, or C).

    Request Body:
        { "image": "<base64 JPEG>" } (raw base64 or data:image/jpeg;base64,... URI)

    Returns:
        200: Hand detected with predicted letter, confidence, probabilities, and 2D landmarks.
        200: No hand found { "hand_detected": false, "letter": null, "confidence": 0, "probabilities": {}, "landmarks": [] }
        400: Missing or invalid image payload.
        413: Image payload exceeds configured MAX_IMAGE_BYTES.
        503: Model file missing / not trained yet { "error": "Model not trained yet" }.
    """
    payload = request.get_json(silent=True)
    if payload is None and request.data:
        try:
            import json
            payload = json.loads(request.data.decode("utf-8"))
        except Exception:
            payload = None

    if not isinstance(payload, dict) or "image" not in payload:
        return jsonify({"error": "Request body must be valid JSON containing an 'image' key"}), 400

    image_raw = payload.get("image")
    if not isinstance(image_raw, str) or not image_raw.strip():
        return jsonify({"error": "The 'image' field must be a non-empty base64 string"}), 400

    # 1. Decode base64 image to OpenCV BGR matrix
    try:
        bgr_image = decode_base64_image(image_raw)
    except PayloadTooLargeError as exc:
        logger.warning("Image payload rejected as too large (413): %s", exc)
        return jsonify({"error": str(exc)}), 413
    except InvalidImageError as exc:
        logger.warning("Image payload rejected as invalid (400): %s", exc)
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        logger.error("Unexpected error decoding image: %s", exc)
        return jsonify({"error": f"Failed to process image frame: {exc}"}), 400

    # 2. Check model readiness; return 503 if model is not trained yet
    if not _classifier.is_loaded:
        _classifier.load_model()

    if not _classifier.is_loaded:
        return jsonify({"error": "Model not trained yet"}), 503

    # 3. Detect 21 hand landmarks using reusable MediaPipe instance
    try:
        landmarks = _detector.detect_landmarks(bgr_image)
    except Exception as exc:
        logger.error("MediaPipe hand detection failed: %s", exc)
        # Never crash on a bad frame; treat as undetected
        return jsonify({
            "hand_detected": False,
            "letter": None,
            "confidence": 0,
            "probabilities": {},
            "landmarks": []
        }), 200

    if not landmarks:
        return jsonify({
            "hand_detected": False,
            "letter": None,
            "confidence": 0,
            "probabilities": {},
            "landmarks": []
        }), 200

    # 4. Extract translation- and scale-invariant 63-element feature vector
    try:
        features = _extractor.extract_features(landmarks)
    except Exception as exc:
        logger.error("Feature extraction error: %s", exc)
        return jsonify({"error": f"Feature extraction failed: {exc}"}), 400

    # 5. Classify sign and return raw probabilities
    try:
        letter, confidence, probabilities = _classifier.predict(features)
        landmarks_2d = HandDetector.to_2d_list(landmarks)

        return jsonify({
            "hand_detected": True,
            "letter": letter,
            "confidence": confidence,
            "probabilities": probabilities,
            "landmarks": landmarks_2d
        }), 200
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503
    except Exception as exc:
        logger.error("Classification failure: %s", exc)
        return jsonify({"error": f"Classification error: {exc}"}), 500

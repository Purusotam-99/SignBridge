"""Step 5: Live webcam sanity check script.

Opens the local camera using OpenCV, extracts landmarks via MediaPipe Hands,
computes the normalized 63-element feature vector, classifies with the trained
Random Forest model, and overlays real-time predictions and joints on the video feed.
"""
import os
import sys
import time
import logging
import numpy as np

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config import MODEL_PATH
from services.hand_detector import HandDetector
from services.feature_extractor import FeatureExtractor
from services.classifier import SignClassifier

try:
    import cv2
except ImportError:
    cv2 = None

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("live_test")


def run_live_sanity_check(camera_index: int = 0):
    if cv2 is None:
        print("[ERROR] OpenCV ('cv2') is not installed. Please install opencv-python.")
        return

    print("=" * 60)
    print("      SIGNBRIDGE LIVE WEBCAM SANITY CHECK")
    print("=" * 60)
    print(f"Loading trained model from: {MODEL_PATH}")

    classifier = SignClassifier(MODEL_PATH)
    if not classifier.is_loaded:
        print(f"[ERROR] Could not load model at {MODEL_PATH}. Run 'python ml/train.py' first.")
        return

    # Initialize live tracking detector (static_image_mode=False for smooth 30fps tracking)
    detector = HandDetector(static_image_mode=False, max_num_hands=1, min_detection_confidence=0.5)
    extractor = FeatureExtractor()

    print(f"Opening camera index {camera_index}...")
    cap = cv2.VideoCapture(camera_index)

    if not cap.isOpened():
        print(f"[WARNING] Could not open video device at index {camera_index}.")
        print("          Ensure your webcam is connected and not occupied by another app.")
        print("          (If running inside a container or headless environment, GUI windows are disabled).")
        return

    print("Camera connected successfully!")
    print("Controls:")
    print("  - Hold up your hand performing ISL sign 'A', 'B', or 'C'")
    print("  - Press 'q' to exit the live sanity check")
    print("-" * 60)

    prev_time = time.time()

    try:
        while True:
            ret, frame = cap.read()
            if not ret or frame is None:
                print("[WARNING] Empty frame received from camera.")
                break

            # Mirror view for intuitive user experience
            frame = cv2.flip(frame, 1)
            h, w, _ = frame.shape

            curr_time = time.time()
            fps = 1.0 / (curr_time - prev_time) if (curr_time - prev_time) > 0 else 30.0
            prev_time = curr_time

            # 1. Detect hand joints
            landmarks = detector.detect_landmarks(frame)

            predicted_letter = None
            confidence = 0.0

            if landmarks:
                # Draw landmarks on frame
                for lm in landmarks:
                    cx, cy = int(lm["x"] * w), int(lm["y"] * h)
                    cv2.circle(frame, (cx, cy), 4, (0, 255, 255), -1)

                # 2. Extract features and predict
                try:
                    features = extractor.extract_features(landmarks)
                    predicted_letter, confidence, probs = classifier.predict(features)
                except Exception as exc:
                    logger.debug("Feature/predict error: %s", exc)

            # 3. Draw UI overlay
            cv2.rectangle(frame, (10, 10), (320, 110), (20, 20, 20), -1)
            cv2.rectangle(frame, (10, 10), (320, 110), (100, 100, 100), 1)

            cv2.putText(frame, f"SignBridge Live (FPS: {fps:.1f})", (20, 32),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (200, 200, 200), 1, cv2.LINE_AA)

            if predicted_letter and confidence >= 0.50:
                color = (0, 220, 0) if confidence >= 0.80 else (0, 180, 255)
                cv2.putText(frame, f"Sign: {predicted_letter}", (20, 68),
                            cv2.FONT_HERSHEY_SIMPLEX, 1.1, color, 2, cv2.LINE_AA)
                cv2.putText(frame, f"Confidence: {confidence * 100:.1f}%", (20, 95),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (220, 220, 220), 1, cv2.LINE_AA)
            else:
                cv2.putText(frame, "No sign detected", (20, 75),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (120, 120, 120), 1, cv2.LINE_AA)

            cv2.imshow("SignBridge Live ISL Recognition (Press 'q' to quit)", frame)

            key = cv2.waitKey(1) & 0xFF
            if key == ord("q") or key == 27:  # 'q' or ESC
                break

    finally:
        cap.release()
        cv2.destroyAllWindows()
        detector.close()
        print("Live sanity check closed cleanly.")


if __name__ == "__main__":
    run_live_sanity_check()

"""Health check route reporting service status and model readiness."""
from flask import Blueprint, jsonify
from services.classifier import SignClassifier

health_bp = Blueprint("health_bp", __name__)

# Shared instance to inspect model readiness
_classifier = SignClassifier()


@health_bp.route("/api/health", methods=["GET"])
def health():
    """
    Returns server operational status and model readiness.
    Response: { "status": "ok", "model_loaded": true/false }
    """
    if not _classifier.is_loaded:
        _classifier.load_model()

    return jsonify({
        "status": "ok",
        "model_loaded": _classifier.is_loaded
    }), 200

"""Metrics route exposing verified offline evaluation results."""
import os
import json
import logging
from flask import Blueprint, jsonify
from config import METRICS_PATH

metrics_bp = Blueprint("metrics_bp", __name__)
logger = logging.getLogger(__name__)


@metrics_bp.route("/api/metrics", methods=["GET"])
def get_metrics():
    """
    Returns verified model evaluation metrics if reports/metrics.json exists.
    If the file does not exist, returns { "available": false }.
    Never returns placeholder or fabricated numbers.
    """
    if not os.path.exists(METRICS_PATH):
        return jsonify({"available": False}), 200

    try:
        with open(METRICS_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)

        # Validate that the file contains actual evaluated metrics
        if not isinstance(data, dict) or "accuracy" not in data:
            return jsonify({"available": False}), 200

        data["available"] = True
        return jsonify(data), 200
    except Exception as exc:
        logger.error("Failed to read metrics file at %s: %s", METRICS_PATH, exc)
        return jsonify({"available": False}), 200

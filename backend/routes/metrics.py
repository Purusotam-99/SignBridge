"""Metrics route exposing verified offline evaluation results."""
import os
import json
import logging
from flask import Blueprint, jsonify, make_response
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
        res = make_response(jsonify({"available": False}), 200)
        res.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        return res

    try:
        with open(METRICS_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)

        # Validate that the file contains actual evaluated metrics
        if not isinstance(data, dict) or "accuracy" not in data:
            res = make_response(jsonify({"available": False}), 200)
            res.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            return res

        data["available"] = True

        # Provide aliases to ensure full frontend compatibility
        data["macro_precision"] = data.get("macro_precision", data.get("precision"))
        data["macro_recall"] = data.get("macro_recall", data.get("recall"))
        data["macro_f1"] = data.get("macro_f1", data.get("f1"))

        per_class = data.get("per_class", data.get("classification_report", {}))
        normalized_per_class = {}
        for k, v in per_class.items():
            normalized_per_class[k] = dict(v)
            if "f1" in v and "f1-score" not in v:
                normalized_per_class[k]["f1-score"] = v["f1"]
            if "f1-score" in v and "f1" not in v:
                normalized_per_class[k]["f1"] = v["f1-score"]

        data["per_class"] = normalized_per_class
        data["classification_report"] = normalized_per_class
        data["classes"] = data.get("classes", data.get("labels", ["A", "B", "C"]))
        data["labels"] = data.get("labels", data.get("classes", ["A", "B", "C"]))

        res = make_response(jsonify(data), 200)
        res.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        return res
    except Exception as exc:
        logger.error("Failed to read metrics file at %s: %s", METRICS_PATH, exc)
        res = make_response(jsonify({"available": False}), 200)
        res.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        return res

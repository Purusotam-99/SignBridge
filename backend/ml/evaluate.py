"""Step 4: Model evaluation on held-out test split only.

Computes accuracy, precision, recall, F1, per-class metrics, confusion matrix,
generates reports/metrics.json, exports reports/confusion_matrix.png, and
executes a separate robustness stress test.
"""
import os
import sys
import json
import logging
from datetime import datetime, timezone
import pandas as pd
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    confusion_matrix,
    classification_report
)
import joblib

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config import (
    TEST_SPLIT_CSV,
    MODEL_PATH,
    METRICS_PATH,
    CONFUSION_MATRIX_PNG,
    REPORTS_DIR,
    LABELS
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("evaluate")


def plot_and_save_confusion_matrix(
    cm: np.ndarray,
    labels: list,
    output_path: str
) -> None:
    """Plots and saves a high-resolution confusion matrix heatmap for presentation slides."""
    try:
        import matplotlib
        matplotlib.use("Agg")  # Non-interactive backend
        import matplotlib.pyplot as plt
        import seaborn as sns

        plt.figure(figsize=(6, 5))
        sns.heatmap(
            cm,
            annot=True,
            fmt="d",
            cmap="Blues",
            xticklabels=[f"Sign {l}" for l in labels],
            yticklabels=[f"Sign {l}" for l in labels],
            cbar=False,
            linewidths=1.5,
            linecolor="white",
            annot_kws={"size": 14, "weight": "bold"}
        )
        plt.title("SignBridge Test Set Confusion Matrix (ISL A / B / C)", fontsize=12, pad=12, weight="bold")
        plt.xlabel("Predicted Label", fontsize=11, labelpad=8)
        plt.ylabel("True Label", fontsize=11, labelpad=8)
        plt.tight_layout()

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        plt.savefig(output_path, dpi=300)
        plt.close()
        logger.info("Saved confusion matrix visualization to: %s", output_path)
    except Exception as exc:
        logger.warning("Could not render confusion_matrix.png with matplotlib/seaborn: %s", exc)


def evaluate_pipeline():
    logger.info("Starting SignBridge model evaluation pipeline...")

    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Trained model not found at {MODEL_PATH}. "
            "Please run 'python ml/train.py' first."
        )

    if not os.path.exists(TEST_SPLIT_CSV):
        raise FileNotFoundError(
            f"Held-out test set not found at {TEST_SPLIT_CSV}. "
            "Please run 'python ml/train.py' first."
        )

    # 1. Load held-out test split strictly (never seen in training)
    df_test = pd.read_csv(TEST_SPLIT_CSV)
    feature_cols = [c for c in df_test.columns if c not in ("label", "source_image")]
    X_test = df_test[feature_cols].values.astype(np.float32)
    y_test = df_test["label"].values.astype(str)

    logger.info("Evaluating exclusively on %d held-out test samples...", len(X_test))

    # 2. Load trained model
    clf = joblib.load(MODEL_PATH)

    # 3. Predict on clean test set
    y_pred = clf.predict(X_test)

    # 4. Compute metrics
    acc = float(accuracy_score(y_test, y_pred))
    prec, rec, f1, _ = precision_recall_fscore_support(
        y_test, y_pred, average="macro", zero_division=0
    )
    cm = confusion_matrix(y_test, y_pred, labels=LABELS)
    raw_report = classification_report(
        y_test, y_pred, labels=LABELS, output_dict=True, zero_division=0
    )

    per_class = {}
    for lbl in LABELS:
        if lbl in raw_report:
            stats = raw_report[lbl]
            per_class[lbl] = {
                "precision": float(round(stats["precision"], 4)),
                "recall": float(round(stats["recall"], 4)),
                "f1": float(round(stats["f1-score"], 4)),
                "f1-score": float(round(stats["f1-score"], 4)),
                "support": int(stats["support"])
            }
        else:
            per_class[lbl] = {"precision": 0.0, "recall": 0.0, "f1": 0.0, "f1-score": 0.0, "support": 0}

    # 5. Build JSON payload strictly matching required schema
    metrics_payload = {
        "available": True,
        "accuracy": float(round(acc, 4)),
        "precision": float(round(float(prec), 4)),
        "recall": float(round(float(rec), 4)),
        "f1": float(round(float(f1), 4)),
        "macro_precision": float(round(float(prec), 4)),
        "macro_recall": float(round(float(rec), 4)),
        "macro_f1": float(round(float(f1), 4)),
        "confusion_matrix": cm.tolist(),
        "labels": LABELS,
        "classes": LABELS,
        "test_samples": int(len(y_test)),
        "per_class": per_class,
        "classification_report": per_class,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }

    # 6. Write reports/metrics.json
    os.makedirs(REPORTS_DIR, exist_ok=True)
    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics_payload, f, indent=2)
    logger.info("Saved verified evaluation metrics to: %s", METRICS_PATH)

    # 7. Generate confusion matrix figure
    plot_and_save_confusion_matrix(cm, LABELS, CONFUSION_MATRIX_PNG)

    # 8. Robustness Stress Check (Separate from main accuracy)
    np.random.seed(42)
    X_test_robust = X_test.copy()
    # Mirror x-coordinates to simulate handedness flip
    X_test_robust[:, 0::3] = -X_test_robust[:, 0::3]
    # Add tracking noise
    X_test_robust += np.random.normal(0, 0.015, X_test.shape).astype(np.float32)

    y_pred_robust = clf.predict(X_test_robust)
    robust_acc = float(accuracy_score(y_test, y_pred_robust))

    # 9. Print Full Classification Report and Robustness Summary
    print("\n" + "=" * 60)
    print("      SIGNBRIDGE HELD-OUT TEST EVALUATION REPORT")
    print("=" * 60)
    print(classification_report(y_test, y_pred, labels=LABELS, zero_division=0))
    print("-" * 60)
    print(f"Overall Accuracy:  {acc * 100:.2f}%")
    print(f"Macro Precision:   {prec * 100:.2f}%")
    print(f"Macro Recall:      {rec * 100:.2f}%")
    print(f"Macro F1-Score:    {f1 * 100:.2f}%")
    print("\nConfusion Matrix (Rows: True [A,B,C], Columns: Pred [A,B,C]):")
    print(cm)
    print("-" * 60)
    print("ROBUSTNESS CHECK (Mirrored + Jittered Stress Test):")
    print(f"Stress Test Accuracy: {robust_acc * 100:.2f}%")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    evaluate_pipeline()

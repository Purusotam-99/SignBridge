"""Step 2 & 3: Model training pipeline with cross-validation and training-only augmentation.

Performs stratified 80/20 train/test split BEFORE augmentation.
Saves held-out test split to backend/data/processed/test_split.csv.
Performs 5-fold cross-validation, hyperparameter tuning via GridSearchCV,
and saves the trained Random Forest model and metadata.
"""
import os
import sys
import json
import logging
from datetime import datetime, timezone
from typing import Tuple, List, Dict
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold, cross_val_score, GridSearchCV, train_test_split
from scipy.spatial.distance import cdist
import joblib

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from config import (
    FEATURES_CSV,
    TEST_SPLIT_CSV,
    MODEL_PATH,
    MODEL_META_PATH,
    MODELS_DIR,
    LABELS
)
from services.feature_extractor import FeatureExtractor

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("train")


def check_near_duplicates(
    X_train: np.ndarray,
    X_test: np.ndarray,
    threshold: float = 0.05
) -> int:
    """
    Computes pairwise Euclidean distances between train and test feature vectors.
    Reports near-duplicate image pairs that could inflate test evaluation scores.
    """
    distances = cdist(X_test, X_train, metric="euclidean")
    min_dist_per_test = np.min(distances, axis=1)
    near_duplicates_count = int(np.sum(min_dist_per_test < threshold))
    return near_duplicates_count


def augment_landmarks_and_extract(
    features_63: np.ndarray,
    extractor: FeatureExtractor
) -> List[np.ndarray]:
    """
    Reconstructs 21 normalized landmarks from the 63-element feature vector,
    applies physical augmentations, and re-extracts invariant features:
    1. Horizontal mirror (negate x coordinates to simulate mirrored webcam / left-right hands).
    2. Small Gaussian tracking jitter (~0.01 noise).
    3. Small in-plane rotation (±8° to ±10°).
    """
    # Reshape (63,) back to (21, 3)
    coords = features_63.reshape(21, 3).copy()
    augmented_features = []

    # 1. Horizontal reflection: negate x coordinate
    coords_mirror = coords.copy()
    coords_mirror[:, 0] = -coords_mirror[:, 0]
    augmented_features.append(extractor.extract_features(coords_mirror))

    # 2. Gaussian tracking jitter
    coords_jitter = coords.copy()
    coords_jitter += np.random.normal(0, 0.01, (21, 3)).astype(np.float32)
    augmented_features.append(extractor.extract_features(coords_jitter))

    # 3. Small in-plane rotation (e.g. +8 degrees)
    theta = np.radians(np.random.uniform(7.0, 10.0) * np.random.choice([-1, 1]))
    cos_t, sin_t = np.cos(theta), np.sin(theta)
    rot_matrix = np.array([
        [cos_t, -sin_t, 0.0],
        [sin_t,  cos_t, 0.0],
        [0.0,    0.0,   1.0]
    ], dtype=np.float32)
    coords_rotated = np.dot(coords, rot_matrix)
    augmented_features.append(extractor.extract_features(coords_rotated))

    return augmented_features


def augment_training_dataset(
    X_train: np.ndarray,
    y_train: np.ndarray,
    extractor: FeatureExtractor
) -> Tuple[np.ndarray, np.ndarray]:
    """Augments training split only with horizontal mirroring, rotation, and tracking jitter."""
    X_aug_list = [X_train]
    y_aug_list = [y_train]

    np.random.seed(42)
    for i in range(len(X_train)):
        aug_vectors = augment_landmarks_and_extract(X_train[i], extractor)
        for vec in aug_vectors:
            X_aug_list.append(vec.reshape(1, -1))
            y_aug_list.append([y_train[i]])

    X_augmented = np.vstack(X_aug_list)
    y_augmented = np.concatenate(y_aug_list)
    return X_augmented, y_augmented


def train_pipeline():
    logger.info("Starting SignBridge model training pipeline...")

    if not os.path.exists(FEATURES_CSV):
        raise FileNotFoundError(
            f"Features dataset not found at {FEATURES_CSV}. "
            "Please run 'python ml/extract_features.py' first."
        )

    df = pd.read_csv(FEATURES_CSV)
    feature_cols = [c for c in df.columns if c not in ("label", "source_image")]
    logger.info("Loaded features dataset: %d samples, %d features.", len(df), len(feature_cols))

    # Check for potential session/subject grouping information
    has_groups = False
    if "subject_id" in df.columns or "session_id" in df.columns:
        has_groups = True
    else:
        print("\n[NOTE] No session or subject ID metadata detected in dataset.")
        print("       Stratified random split will be used. Near-duplicate burst photos")
        print("       could potentially inflate cross-validation scores if present.")

    # 1. Stratified 80/20 train/test split BEFORE augmentation
    train_df, test_df = train_test_split(
        df,
        test_size=0.20,
        random_state=42,
        stratify=df["label"]
    )

    # 2. Save held-out test set to test_split.csv
    os.makedirs(os.path.dirname(TEST_SPLIT_CSV), exist_ok=True)
    test_df.to_csv(TEST_SPLIT_CSV, index=False)
    logger.info("Saved held-out test split (%d samples) to: %s", len(test_df), TEST_SPLIT_CSV)

    X_train_raw = train_df[feature_cols].values.astype(np.float32)
    y_train_raw = train_df["label"].values.astype(str)
    X_test_raw = test_df[feature_cols].values.astype(np.float32)

    # 3. Detect near-duplicates between train and test
    near_dups = check_near_duplicates(X_train_raw, X_test_raw, threshold=0.04)
    print(f"\n[LEAKAGE CHECK] Found {near_dups} near-duplicate test samples (Euclidean distance < 0.04).")

    # 4. 5-Fold Stratified Cross-Validation on Baseline Model (Train Split Only)
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    baseline_clf = RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1)
    cv_scores = cross_val_score(baseline_clf, X_train_raw, y_train_raw, cv=cv, scoring="accuracy")

    print("\n" + "=" * 55)
    print("      5-FOLD STRATIFIED CV ACCURACY (TRAIN ONLY)")
    print("=" * 55)
    for fold_idx, score in enumerate(cv_scores, 1):
        print(f"Fold {fold_idx}: {score * 100:.2f}%")
    print("-" * 55)
    print(f"Mean CV Accuracy: {cv_scores.mean() * 100:.2f}% (std: {cv_scores.std() * 100:.2f}%)")
    print("=" * 55)

    # 5. Data Augmentation (Applied ONLY to Training Split)
    extractor = FeatureExtractor()
    X_train_aug, y_train_aug = augment_training_dataset(X_train_raw, y_train_raw, extractor)
    logger.info(
        "Training split augmented from %d to %d samples (mirrored, jittered, rotated).",
        len(X_train_raw),
        len(X_train_aug)
    )

    # 6. Light Hyperparameter Search on Train Split
    param_grid = {
        "n_estimators": [100, 200, 300],
        "max_depth": [None, 10, 20],
        "min_samples_leaf": [1, 2, 4]
    }

    grid_search = GridSearchCV(
        estimator=RandomForestClassifier(random_state=42, class_weight="balanced", n_jobs=-1),
        param_grid=param_grid,
        cv=cv,
        scoring="accuracy",
        n_jobs=-1
    )

    logger.info("Running GridSearchCV over hyperparameter grid...")
    grid_search.fit(X_train_aug, y_train_aug)
    best_clf = grid_search.best_estimator_
    best_params = grid_search.best_params_

    print("\n" + "=" * 55)
    print("           HYPERPARAMETER SEARCH RESULTS")
    print("=" * 55)
    print("Best Parameters:")
    for param, val in best_params.items():
        print(f"  - {param}: {val}")
    print(f"Best Grid CV Accuracy: {grid_search.best_score_ * 100:.2f}%")
    print("=" * 55)

    # 7. Save Best Model to models/isl_rf_model.joblib
    os.makedirs(MODELS_DIR, exist_ok=True)
    joblib.dump(best_clf, MODEL_PATH)
    logger.info("Saved trained Random Forest model to: %s", MODEL_PATH)

    # 8. Save Model Metadata to models/model_meta.json
    model_meta = {
        "model_name": "RandomForestClassifier",
        "labels": LABELS,
        "num_features": len(feature_cols),
        "feature_columns": feature_cols,
        "training_date": datetime.now(timezone.utc).isoformat(),
        "train_samples_raw": len(X_train_raw),
        "train_samples_augmented": len(X_train_aug),
        "test_samples_count": len(test_df),
        "cv_mean_accuracy": float(round(cv_scores.mean(), 4)),
        "cv_std_accuracy": float(round(cv_scores.std(), 4)),
        "best_hyperparameters": best_params
    }

    with open(MODEL_META_PATH, "w", encoding="utf-8") as f:
        json.dump(model_meta, f, indent=2)
    logger.info("Saved model metadata to: %s", MODEL_META_PATH)

    # 9. Top 10 Feature Importances
    importances = best_clf.feature_importances_
    sorted_idx = np.argsort(importances)[::-1][:10]

    print("\n" + "=" * 55)
    print("            TOP 10 FEATURE IMPORTANCES")
    print("=" * 55)
    for rank, idx in enumerate(sorted_idx, 1):
        col_name = feature_cols[idx]
        joint_idx = idx // 3
        axis = ["X", "Y", "Z"][idx % 3]
        print(f"#{rank:<2} {col_name:<6} (Joint {joint_idx:>2} {axis}-axis): {importances[idx]:.4f}")
    print("=" * 55 + "\n")


if __name__ == "__main__":
    train_pipeline()

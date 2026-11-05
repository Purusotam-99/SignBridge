# SignBridge ML Pipeline (ISL A, B, C Recognition)

Machine learning pipeline that extracts 21 MediaPipe hand landmarks from raw Indian Sign Language images, applies translation and scale normalization, trains a Random Forest classifier, and evaluates performance on a held-out test split.

---

## 1. Adding Dataset Images

Place raw image files (`.jpg`, `.jpeg`, `.png`) into the corresponding class folder under `backend/data/raw/`:

```
backend/data/raw/
├── A/   # Images of sign 'A' (closed fist, upright thumb)
├── B/   # Images of sign 'B' (open palm, 4 fingers straight up, thumb tucked)
└── C/   # Images of sign 'C' (curved fingers and thumb forming C arch)
```

- **Recommended minimum**: ≥ 100 images per class.
- **Class balance**: Avoid letting any class have more than 2x the count of another class.
- **Image quality**: Clear lighting and visibility of hand gestures without extreme occlusions.

---

## 2. Pipeline Execution Order

Always execute the three stages in order:

```bash
cd backend
python ml/extract_features.py  # Stage 1: Feature Extraction
python ml/train.py             # Stage 2: Train/Test Split & RF Training
python ml/evaluate.py          # Stage 3: Held-out Test Evaluation
```

### Stage 1: Feature Extraction (`ml/extract_features.py`)
- Loops through `data/raw/A`, `B`, and `C`.
- Detects the 21 hand joints using MediaPipe Hands (`static_image_mode=True`).
- Computes translation invariance (wrist origin subtraction) and scale invariance (max-abs division).
- Saves feature vectors to `data/processed/features.csv` with columns `f0 ... f62, label, source_image`.
- Skips bad frames and outputs an inventory summary table.

### Stage 2: Model Training (`ml/train.py`)
- Splits the dataset into an **80% train** and **20% held-out test** split using a fixed seed (`random_state=42`) **before any augmentation**.
- Checks for potential near-duplicates between train and test using pairwise Euclidean distance.
- Saves the unaugmented held-out test split to `data/processed/test_split.csv`.
- Augments the training split only (horizontal mirror reflection, tracking jitter noise, and in-plane rotation) to prepare for mirrored webcam feeds.
- Runs 5-fold stratified cross-validation and performs a grid search over hyperparameters:
  - `n_estimators`: [100, 200, 300]
  - `max_depth`: [None, 10, 20]
  - `min_samples_leaf`: [1, 2, 4]
- Saves the best model to `models/isl_rf_model.joblib` and training metadata to `models/model_meta.json`.
- Prints the top 10 most influential feature importances.

### Stage 3: Evaluation (`ml/evaluate.py`)
- Evaluates **strictly on the held-out test set** from `test_split.csv` (never on training data).
- Computes accuracy, macro precision, recall, F1, per-class breakdown, and the 3×3 confusion matrix.
- Generates `reports/metrics.json` matching the exact API contract schema.
- Exports a publication-ready confusion matrix visualization to `reports/confusion_matrix.png`.
- Runs a separate **robustness stress check** with mirrored and jittered test coordinates.

### Optional Live Sanity Check (`ml/live_test.py`)
```bash
python ml/live_test.py
```
Opens your local webcam using OpenCV, runs real-time inference, and overlays predicted letters, confidence bars, and joint landmarks at 30+ FPS. Press `q` to exit.

---

## 3. How to Read Results

- **Overall Accuracy**: Fraction of test samples classified correctly across A, B, and C.
- **Macro Precision**: Measures exactness (avoiding false positives) equally across all three classes.
- **Macro Recall**: Measures sensitivity (avoiding false negatives) equally across all three classes.
- **Confusion Matrix**:
  - Row 0 = True Sign A (Col 0: Predicted A, Col 1: Predicted B, Col 2: Predicted C)
  - Row 1 = True Sign B
  - Row 2 = True Sign C
  - A diagonal-dominant matrix indicates strong class discrimination.
- **Robustness Check**: Verifies that mirrored gestures and tracking noise still produce reliable classifications on live webcam streams.

---

## 4. Known Limitations

1. **Small 3-Letter Vocabulary**: Specifically calibrated for alphabet letters A, B, and C. It does not transcribe the full 26-letter alphabet or conversational ISL vocabulary.
2. **Static Hand Signs Only**: Recognizes static hand postures. Dynamic gestures requiring motion paths or temporal sequences are not covered by the single-frame Random Forest classifier.
3. **Closed-World Classification**: A 3-class model outputs one of A, B, or C for any hand detected. For live use, the frontend must apply a confidence threshold (e.g. ≥ 80%) to filter out arbitrary non-sign gestures.

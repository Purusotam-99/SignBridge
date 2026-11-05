# SignBridge Backend

Flask API and machine learning service for Indian Sign Language (ISL) alphabet recognition (**A, B, and C**).

---

## Prerequisites & Setup

1. **Python Environment**:
   Requires Python 3.10 or higher. Create and activate a virtual environment:

   ```bash
   cd backend
   python -m venv .venv

   # On Windows (PowerShell):
   .\.venv\Scripts\Activate.ps1

   # On Linux / macOS:
   source .venv/bin/activate
   ```

2. **Install Dependencies**:

   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment** (Optional):

   ```bash
   cp .env.example .env
   ```

---

## Dataset Location

Place your raw offline ISL image files inside `backend/data/raw/` in their respective letter subdirectories:

```
backend/data/raw/
├── A/     # Drop raw image photos for Sign 'A' (.png, .jpg, .jpeg)
├── B/     # Drop raw image photos for Sign 'B'
└── C/     # Drop raw image photos for Sign 'C'
```

---

## Machine Learning Pipeline Run Order

Execute the pipeline in this exact order:

```
1. extract_features.py  ──>  2. train.py  ──>  3. evaluate.py  ──>  4. app.py
```

### Step 1: Extract Normalized Features
Scans `backend/data/raw/{A,B,C}/`, extracts 21-point hand mesh coordinates using MediaPipe (`static_image_mode=True`), applies translation and scale normalization, and saves `backend/data/processed/features.csv`:

```bash
python ml/extract_features.py
```

### Step 2: Model Training
Loads `features.csv`, creates a stratified 80/20 train/test split (`random_state=42`), saves the held-out test split, applies horizontal flip and noise data augmentation to the training split only, and trains a 200-tree `RandomForestClassifier`:

```bash
python ml/train.py
```
The model artifact is saved to `backend/models/isl_rf_model.joblib`.

### Step 3: Model Evaluation
Evaluates strictly on the held-out test split (`test_features.csv`). Computes accuracy, precision, recall, F1, and the confusion matrix, and writes the verified report to `backend/reports/metrics.json`:

```bash
python ml/evaluate.py
```

### Step 4: Run the API Server

```bash
python app.py
```
The Flask server starts at `http://localhost:5000`.

---

## API Contract & Example `curl` Commands

### 1. Health Check (`GET /api/health`)

Checks if the server is operational and if the classification model is loaded.

```bash
curl -X GET http://localhost:5000/api/health
```

**Response**:
```json
{
  "status": "ok",
  "model_loaded": true
}
```

---

### 2. Live Sign Prediction (`POST /api/predict`)

Accepts a base64 encoded frame (supports raw base64 and `data:image/jpeg;base64,...` data URIs).

```bash
curl -X POST http://localhost:5000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."}'
```

**Success Response (Hand Detected)**:
```json
{
  "hand_detected": true,
  "letter": "A",
  "confidence": 0.93,
  "probabilities": {
    "A": 0.93,
    "B": 0.05,
    "C": 0.02
  },
  "landmarks": [
    [0.51, 0.72],
    [0.48, 0.69]
  ]
}
```

**Response (No Hand Detected)**:
```json
{
  "hand_detected": false,
  "letter": null,
  "confidence": 0,
  "probabilities": {},
  "landmarks": []
}
```

**Error Responses**:
- `400`: Missing or corrupted image (`{"error": "The 'image' field must be a non-empty base64 string"}`)
- `413`: Payload size exceeds `MAX_IMAGE_BYTES` (`{"error": "Image payload size exceeds maximum limit"}`)
- `503`: Model missing (`{"error": "Model not trained yet"}`)

---

### 3. Model Evaluation Metrics (`GET /api/metrics`)

Returns real offline evaluation metrics from `reports/metrics.json`. Never returns placeholder numbers.

```bash
curl -X GET http://localhost:5000/api/metrics
```

**Response (Metrics Available)**:
```json
{
  "available": true,
  "accuracy": 1.0,
  "precision": 1.0,
  "recall": 1.0,
  "f1": 1.0,
  "confusion_matrix": [
    [10, 0, 0],
    [0, 10, 0],
    [0, 0, 10]
  ],
  "labels": ["A", "B", "C"],
  "test_samples": 30,
  "per_class": {
    "A": {"precision": 1.0, "recall": 1.0, "f1": 1.0, "support": 10},
    "B": {"precision": 1.0, "recall": 1.0, "f1": 1.0, "support": 10},
    "C": {"precision": 1.0, "recall": 1.0, "f1": 1.0, "support": 10}
  }
}
```

**Response (When Evaluation is Pending)**:
```json
{
  "available": false
}
```

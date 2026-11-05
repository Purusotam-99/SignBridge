# SignBridge — Indian Sign Language (ISL) Communication Assistant

A responsive, minimalist communication bridge for the Indian Sign Language (ISL) alphabet (letters **A, B, and C**). Built with React, Vite, Tailwind CSS, Lucide icons, and Recharts.

---

## Visual Design & Aesthetics

- **Background**: Soft pastel gradient transitioning from pink-lavender (top-left) through light blue to faint mint (bottom-right).
- **Cards**: Clean white cards (`rounded-xl`), 1px light border (`border-slate-200/90`), and very subtle shadow.
- **Grid Layout**: Strict two-column and responsive layouts with zero card overlap.
- **Typography & Accents**: Compact Inter typography, small muted subtitles, small pill status badges, clean lavender/blue accents, a solid red Stop button, green for high confidence, and amber for medium confidence.
- **Accessibility**: High-contrast text, visible focus rings, and explicit `aria-label`s on all icon buttons.

---

## Supported Vocabulary & Strict Constraints

> **Fingerspelling Disclaimer**: Letter-by-letter fingerspelling only. This is not full ISL sentence translation.

- **Vocabulary**: Strictly limited to alphabet letters **A, B, and C**. No claims of universal ISL sentence translation are made anywhere in the application.
- **No Fabricated Metrics**: Evaluation scores and confusion matrix data are strictly loaded from `GET /api/metrics`. If unavailable or pending, the UI displays **"Evaluation pending"**.
- **Anti-Spam Auto-Append Logic**: Automatically appends a letter to the text builder only when the same sign is held with confidence ≥ 0.80 for ~3 consecutive frames. It requires a hand-removed or letter-change gap before appending again, preventing repetitive letter spam (e.g., "AAAAAAAA").
- **Demo Mode**: If the Flask backend is offline or unreachable, a prominent **"Demo mode — backend offline"** badge is displayed, and clearly labeled simulated predictions can be used for UI validation.

---

## Pages & Routes

1. **Dashboard (`/`)**:
   - **Centered Title Block**: "ISL ALPHABET RECOGNITION" small-caps badge, main heading, and subtitle.
   - **Sign Language Input (Left Card)**: Status badges (Active/Idle, Processing, Connected/Disconnected), dark webcam preview with overlay canvas for hand mesh landmarks, red Start/Stop Recognition button, Show/Hide Hand Landmarks toggle, live status line with indicator dot ("Processing ISL predictions…"), and captured-gesture thumbnail snapshot.
   - **Prediction Card (Right Column, Top)**: Big predicted letter (A, B, C), confidence tier badge (High ≥80% green, Medium 50–79% amber, Low <50% red), confidence percentage progress bar, top-3 class probability distribution bars, and status line.
   - **Text Builder Card (Right Column, Bottom)**: Live textarea auto-assembling recognized letters into words (e.g. C → A → B = "CAB"), with Backspace, Clear, Copy, and Speak (Web Speech API) buttons.
   - **Recognition History (Full-Width Bottom Card)**: Chronological log of past detections with timestamps, letters, and confidence badges. Includes an empty state view when no recognitions have occurred.

2. **Live Recognition (`/live`)**:
   - Expanded, focused camera workspace for continuous signing with live prediction panel, reference posture guide, and text builder.

3. **Text to Sign (`/text-to-sign`)**:
   - Text input supporting quick sample presets (`CAB`, `ABC`, `BAC`, etc.).
   - Visual grid of ISL sign illustration cards for A, B, and C.
   - Muted placeholder cards for unsupported characters with a clear message: *"Only A, B and C are supported right now."*
   - Prominent fingerspelling disclaimer note.

4. **Model Analytics (`/analytics`)**:
   - Top KPI cards: Accuracy, Macro Precision, Macro Recall, Macro F1-Score.
   - Styled 3×3 Heatmap Confusion Matrix for A, B, and C.
   - Recharts Prediction Distribution Bar Chart.
   - Recognition history table.
   - Displays **"Evaluation pending"** across all metric cards and charts if `metrics.json` has not yet been generated.

---

## Getting Started

### 1. Frontend Setup

From the project root:

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server will start at `http://localhost:5173`.

### 2. Backend Setup

In a separate terminal:

```bash
cd backend
pip install -r requirements.txt
python app.py
```

The Flask API server will start on `http://localhost:5000`.

---

## Machine Learning Pipeline

Execute in the following sequential order:

```
cd backend
python ml/extract_features.py  # 1. Dataset images -> features.csv
python ml/train.py             # 2. Train Random Forest -> models/isl_rf_model.joblib
python ml/evaluate.py          # 3. Evaluate test set -> reports/metrics.json
```

---

## API Contract

### `GET /api/health`
Verifies server connectivity and model status.
```json
{
  "status": "healthy",
  "model_loaded": true,
  "classes": ["A", "B", "C"],
  "confidence_threshold": 0.70
}
```

### `POST /api/predict`
Accepts a base64 encoded video frame and returns predictions.
- **Request**:
  ```json
  { "image": "data:image/jpeg;base64,..." }
  ```
- **Response (Hand detected)**:
  ```json
  {
    "letter": "A",
    "confidence": 0.93,
    "probabilities": { "A": 0.93, "B": 0.05, "C": 0.02 },
    "landmarks": [[0.51, 0.62], [0.48, 0.58]],
    "hand_detected": true
  }
  ```
- **Response (No hand detected)**:
  ```json
  {
    "letter": null,
    "confidence": 0.0,
    "probabilities": { "A": 0.0, "B": 0.0, "C": 0.0 },
    "landmarks": [],
    "hand_detected": false,
    "message": "No hand detected in frame"
  }
  ```

### `GET /api/metrics`
Returns verified test-set metrics.
- **When evaluation is pending (`metrics.json` absent)**:
  ```json
  { "available": false, "message": "Evaluation pending" }
  ```
- **When evaluation has been generated**:
  ```json
  {
    "available": true,
    "model": "Random Forest Classifier (100 Trees)",
    "accuracy": 1.0,
    "precision": 1.0,
    "recall": 1.0,
    "f1": 1.0,
    "labels": ["A", "B", "C"],
    "confusion_matrix": [
      [10, 0, 0],
      [0, 10, 0],
      [0, 0, 10]
    ]
  }
  ```

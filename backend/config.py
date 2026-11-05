"""Global configuration parameters for the SignBridge backend service.

Values can be customized via environment variables or a .env file.
"""
import os
import tempfile

# Ensure matplotlib uses a writable temp cache directory to avoid permissions warnings
os.environ.setdefault("MPLCONFIGDIR", os.path.join(tempfile.gettempdir(), "matplotlib"))

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Vocabulary: Strictly limited to Indian Sign Language alphabet A, B, and C
LABELS = ["A", "B", "C"]

# Data Directories
DATA_DIR = os.path.join(BASE_DIR, "data")
RAW_DATA_DIR = os.getenv("RAW_DATA_DIR", os.path.join(DATA_DIR, "raw"))
PROCESSED_DATA_DIR = os.path.join(DATA_DIR, "processed")
FEATURES_CSV = os.getenv("FEATURES_CSV", os.path.join(PROCESSED_DATA_DIR, "features.csv"))
TEST_SPLIT_CSV = os.getenv("TEST_SPLIT_CSV", os.path.join(PROCESSED_DATA_DIR, "test_split.csv"))
TEST_DATA_CSV = TEST_SPLIT_CSV

# Model & Evaluation Report Paths
MODELS_DIR = os.path.join(BASE_DIR, "models")
MODEL_PATH = os.getenv("MODEL_PATH", os.path.join(MODELS_DIR, "isl_rf_model.joblib"))
MODEL_META_PATH = os.path.join(MODELS_DIR, "model_meta.json")
HAND_LANDMARKER_MODEL_PATH = os.getenv(
    "HAND_LANDMARKER_MODEL_PATH",
    os.path.join(MODELS_DIR, "hand_landmarker.task")
)

REPORTS_DIR = os.path.join(BASE_DIR, "reports")
METRICS_PATH = os.getenv("METRICS_PATH", os.path.join(REPORTS_DIR, "metrics.json"))
CONFUSION_MATRIX_PNG = os.path.join(REPORTS_DIR, "confusion_matrix.png")

# MediaPipe Hands Settings
MIN_DETECTION_CONFIDENCE = float(os.getenv("MIN_DETECTION_CONFIDENCE", "0.5"))
MIN_TRACKING_CONFIDENCE = float(os.getenv("MIN_TRACKING_CONFIDENCE", "0.5"))

# Server Network Settings
PORT = int(os.getenv("PORT", "5000"))
HOST = os.getenv("HOST", "0.0.0.0")
DEBUG = os.getenv("FLASK_DEBUG", "False").lower() in ("true", "1", "yes")

# CORS Allowed Origins (default to local Vite frontend and common development ports)
_origins_env = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:3000,http://127.0.0.1:3000"
)
ALLOWED_ORIGINS = [orig.strip() for orig in _origins_env.split(",") if orig.strip()]

# Maximum payload size in bytes (default: 5 MB) to reject oversized frames
MAX_IMAGE_BYTES = int(os.getenv("MAX_IMAGE_BYTES", str(5 * 1024 * 1024)))

"""Random Forest classification service loading models and returning predictions."""
import os
import logging
from typing import Dict, Tuple, Optional, Any
import numpy as np

try:
    import joblib
except ImportError:
    joblib = None

from config import MODEL_PATH, LABELS

logger = logging.getLogger(__name__)


class SignClassifier:
    """
    Loads the trained Random Forest model and exposes inference via predict_proba.
    If the model file is missing, the classifier starts unloaded and allows routes
    to return HTTP 503 without crashing the server.
    """

    def __init__(self, model_path: str = MODEL_PATH):
        self.model_path = model_path
        self.model: Optional[Any] = None
        self.classes = LABELS.copy()
        self.load_model()

    def load_model(self) -> bool:
        """
        Attempts to load the joblib model from disk.
        Returns True if loaded successfully, False otherwise.
        """
        if joblib is None:
            logger.warning("joblib is not available in the current Python environment")
            self.model = None
            return False

        if not os.path.exists(self.model_path):
            logger.info("Model file not found at %s. Classifier is in unloaded state.", self.model_path)
            self.model = None
            return False

        try:
            loaded = joblib.load(self.model_path)
            self.model = loaded
            if hasattr(loaded, "classes_"):
                self.classes = [str(c) for c in loaded.classes_]
            logger.info("SignClassifier model loaded successfully with classes: %s", self.classes)
            return True
        except Exception as exc:
            logger.error("Failed to load model from %s: %s", self.model_path, exc)
            self.model = None
            return False

    @property
    def is_loaded(self) -> bool:
        """Returns True if the model is ready for inference."""
        return self.model is not None

    def predict(self, feature_vector: np.ndarray) -> Tuple[str, float, Dict[str, float]]:
        """
        Predicts ISL alphabet letter from a 63-dimensional feature vector.
        Outputs raw, honest probabilities from predict_proba without artificial inflation.

        Args:
            feature_vector: 1D numpy array of 63 normalized coordinates.

        Returns:
            Tuple of:
            - letter (str): The predicted class with highest probability ('A', 'B', or 'C').
            - confidence (float): The maximum probability score (0.0 to 1.0).
            - probabilities_dict (dict): Map of all supported classes to their probability.

        Raises:
            RuntimeError: If model is not loaded.
        """
        if not self.is_loaded:
            raise RuntimeError("Model not trained yet")

        x = np.asarray(feature_vector, dtype=np.float32).reshape(1, -1)

        if hasattr(self.model, "predict_proba"):
            probs = self.model.predict_proba(x)[0]
            probabilities_dict = {}

            # Map raw probabilities to class labels
            for cls_name, prob in zip(self.model.classes_, probs):
                probabilities_dict[str(cls_name)] = float(round(float(prob), 4))

            # Ensure all configured labels are represented
            for label in LABELS:
                if label not in probabilities_dict:
                    probabilities_dict[label] = 0.0

            # Find best class honestly
            best_letter = max(probabilities_dict.keys(), key=lambda k: probabilities_dict[k])
            confidence = probabilities_dict[best_letter]

            return best_letter, confidence, probabilities_dict
        else:
            # Fallback for models without predict_proba
            pred_letter = str(self.model.predict(x)[0])
            probabilities_dict = {lbl: (1.0 if lbl == pred_letter else 0.0) for lbl in LABELS}
            return pred_letter, 1.0, probabilities_dict

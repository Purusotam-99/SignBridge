"""Feature extraction service converting 21 3D hand landmarks into normalized feature vectors."""
from typing import List, Dict, Union
import numpy as np


class FeatureExtractor:
    """
    Transforms 21 MediaPipe hand landmarks into a translation- and scale-invariant
    63-dimensional feature vector (x, y, z for 21 joints).

    Transformation steps:
    1. Subtract the wrist landmark (index 0) from all 21 points (translation invariance).
    2. Divide by the maximum absolute coordinate value so scale/distance does not matter.
    3. Flatten to a 1D vector of 63 float values.

    The exact same transformation is used for dataset training and live inference.
    """

    NUM_LANDMARKS = 21
    NUM_FEATURES = 63  # 21 landmarks * 3 dimensions (x, y, z)

    @classmethod
    def get_feature_names(cls) -> List[str]:
        """Returns standard feature column names [f0 ... f62] for CSV serialization."""
        return [f"f{i}" for i in range(cls.NUM_FEATURES)]

    def extract_features(
        self,
        landmarks: Union[List[Dict[str, float]], np.ndarray, List[List[float]]]
    ) -> np.ndarray:
        """
        Converts 21 hand landmarks into a 63-element normalized numpy array.

        Args:
            landmarks: List of 21 landmark dicts, 2D list, or (21, 3) numpy array.

        Returns:
            np.ndarray: 1D array of shape (63,) with dtype float32.
        """
        if landmarks is None or len(landmarks) < self.NUM_LANDMARKS:
            raise ValueError(
                f"Feature extraction requires {self.NUM_LANDMARKS} landmarks, "
                f"got {len(landmarks) if landmarks is not None else 0}"
            )

        # 1. Parse into shape (21, 3)
        coords = np.zeros((self.NUM_LANDMARKS, 3), dtype=np.float32)
        if isinstance(landmarks[0], dict):
            for i in range(self.NUM_LANDMARKS):
                coords[i, 0] = landmarks[i]["x"]
                coords[i, 1] = landmarks[i]["y"]
                coords[i, 2] = landmarks[i].get("z", 0.0)
        else:
            for i in range(self.NUM_LANDMARKS):
                pt = landmarks[i]
                coords[i, 0] = pt[0]
                coords[i, 1] = pt[1]
                coords[i, 2] = pt[2] if len(pt) > 2 else 0.0

        # 2. Subtract wrist landmark (index 0) from all points
        wrist = coords[0].copy()
        rel_coords = coords - wrist

        # 3. Divide by the maximum absolute coordinate value for scale invariance
        max_abs = float(np.max(np.abs(rel_coords)))
        if max_abs > 1e-6:
            norm_coords = rel_coords / max_abs
        else:
            norm_coords = rel_coords

        # 4. Flatten to 63-element vector
        return norm_coords.flatten()

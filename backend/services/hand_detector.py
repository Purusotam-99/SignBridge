"""MediaPipe Hands wrapper for extracting normalized hand landmarks."""
import os
import logging
from typing import List, Dict, Optional, Tuple, Any
import numpy as np

try:
    import cv2
except ImportError:
    cv2 = None

try:
    import mediapipe as mp
except ImportError:
    mp = None

from config import (
    MIN_DETECTION_CONFIDENCE,
    MIN_TRACKING_CONFIDENCE,
    HAND_LANDMARKER_MODEL_PATH
)

logger = logging.getLogger(__name__)


class HandDetector:
    """
    Wrapper around MediaPipe Hands.
    Supports both MediaPipe Tasks API (MediaPipe 1.x) and legacy Solutions API (MediaPipe 0.10.x).
    Supports video-style live tracking and static dataset image extraction.
    """

    def __init__(
        self,
        static_image_mode: bool = False,
        max_num_hands: int = 1,
        min_detection_confidence: float = MIN_DETECTION_CONFIDENCE,
        min_tracking_confidence: float = MIN_TRACKING_CONFIDENCE
    ):
        self.static_image_mode = static_image_mode
        self.max_num_hands = max_num_hands
        self.min_detection_confidence = min_detection_confidence
        self.min_tracking_confidence = min_tracking_confidence
        self.mode = None
        self.detector = None

        if mp is None:
            logger.warning("MediaPipe library is not installed.")
            return

        # 1. Try legacy MediaPipe solutions API (MediaPipe <= 0.10.x)
        if hasattr(mp, "solutions") and hasattr(mp.solutions, "hands"):
            try:
                self.detector = mp.solutions.hands.Hands(
                    static_image_mode=self.static_image_mode,
                    max_num_hands=self.max_num_hands,
                    min_detection_confidence=self.min_detection_confidence,
                    min_tracking_confidence=self.min_tracking_confidence
                )
                self.mode = "solutions"
                logger.info("Initialized MediaPipe Hands using solutions API")
                return
            except Exception as exc:
                logger.warning("Failed initializing MediaPipe solutions.hands: %s", exc)

        # 2. Try modern MediaPipe Tasks Vision API (MediaPipe >= 1.0)
        try:
            from mediapipe.tasks.python.vision import HandLandmarker, HandLandmarkerOptions
            from mediapipe.tasks.python import BaseOptions

            model_path = HAND_LANDMARKER_MODEL_PATH
            if os.path.exists(model_path):
                options = HandLandmarkerOptions(
                    base_options=BaseOptions(model_asset_path=model_path),
                    num_hands=self.max_num_hands,
                    min_hand_detection_confidence=self.min_detection_confidence
                )
                self.detector = HandLandmarker.create_from_options(options)
                self.mode = "tasks"
                logger.info("Initialized MediaPipe HandLandmarker using Tasks API (%s)", model_path)
                return
            else:
                logger.warning("MediaPipe hand landmarker model file not found at %s", model_path)
        except Exception as exc:
            logger.warning("Could not initialize MediaPipe Tasks HandLandmarker: %s", exc)

    def detect_landmarks(self, bgr_image: np.ndarray) -> Optional[List[Dict[str, float]]]:
        """
        Detects hand joints in a BGR image.
        Returns a list of 21 dictionaries with normalized coordinates {'x', 'y', 'z'},
        or None if no hand is found in the frame.
        """
        if bgr_image is None or bgr_image.size == 0 or self.detector is None:
            return None

        # Convert to RGB color format
        if cv2 is not None:
            rgb_image = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2RGB)
        else:
            rgb_image = bgr_image[:, :, ::-1]

        # Case 1: Legacy Solutions API
        if self.mode == "solutions":
            results = self.detector.process(rgb_image)
            if not results or not results.multi_hand_landmarks:
                return None
            primary_hand = results.multi_hand_landmarks[0]
            landmarks = []
            for lm in primary_hand.landmark:
                landmarks.append({
                    "x": float(lm.x),
                    "y": float(lm.y),
                    "z": float(lm.z)
                })
            return landmarks

        # Case 2: Modern Tasks API
        if self.mode == "tasks":
            try:
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_image)
                results = self.detector.detect(mp_image)
                if not results or not results.hand_landmarks or len(results.hand_landmarks) == 0:
                    return None
                primary_hand = results.hand_landmarks[0]
                landmarks = []
                for lm in primary_hand:
                    landmarks.append({
                        "x": float(lm.x),
                        "y": float(lm.y),
                        "z": float(getattr(lm, "z", 0.0))
                    })
                return landmarks
            except Exception as exc:
                logger.error("Error in MediaPipe Tasks detection: %s", exc)
                return None

        return None

    @staticmethod
    def to_2d_list(landmarks: List[Dict[str, float]]) -> List[List[float]]:
        """
        Formats 21 landmarks into the 2D array [[x, y], ...] required by the API contract.
        """
        if not landmarks:
            return []
        return [[round(float(lm["x"]), 4), round(float(lm["y"]), 4)] for lm in landmarks]

    def close(self):
        """Release underlying MediaPipe pipeline resources."""
        if self.detector is not None and hasattr(self.detector, "close"):
            self.detector.close()

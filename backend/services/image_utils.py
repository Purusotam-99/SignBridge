"""Utility service for base64 image decoding, validation, and preprocessing."""
import base64
import re
from typing import Optional
import numpy as np

try:
    import cv2
except ImportError:
    cv2 = None

from config import MAX_IMAGE_BYTES


class PayloadTooLargeError(Exception):
    """Raised when the base64 image exceeds the configured maximum byte limit."""
    pass


class InvalidImageError(ValueError):
    """Raised when the base64 image string is corrupted or cannot be decoded."""
    pass


def decode_base64_image(base64_str: str, max_bytes: int = MAX_IMAGE_BYTES) -> np.ndarray:
    """
    Decodes a base64 encoded image string (with or without data-URI prefix) into an OpenCV BGR image.

    Validates that:
    1. The payload string is non-empty.
    2. The decoded size does not exceed max_bytes (raises PayloadTooLargeError -> 413).
    3. The base64 data and image headers are valid (raises InvalidImageError -> 400).

    Args:
        base64_str: Base64 encoded image string or data URI.
        max_bytes: Maximum allowed decoded image payload size in bytes.

    Returns:
        np.ndarray: Decoded OpenCV image in BGR color format.
    """
    if not base64_str or not isinstance(base64_str, str):
        raise InvalidImageError("Image payload is missing or empty")

    # Strip data-URI prefix if present (e.g. 'data:image/jpeg;base64,')
    if "base64," in base64_str:
        base64_str = base64_str.split("base64,")[1]

    # Clean whitespace or line breaks
    base64_str = re.sub(r"\s+", "", base64_str)
    if not base64_str:
        raise InvalidImageError("Image base64 data is empty after stripping prefix")

    # Quick check of payload length and estimated decoded binary size before memory allocation
    if len(base64_str) > max_bytes:
        raise PayloadTooLargeError(f"Image payload ({len(base64_str)} characters) exceeds maximum limit of {max_bytes} bytes")

    # 4 base64 characters encode 3 raw bytes
    approx_size = (len(base64_str) * 3) // 4
    if approx_size > max_bytes:
        raise PayloadTooLargeError(f"Decoded image payload exceeds maximum limit of {max_bytes} bytes")

    try:
        raw_bytes = base64.b64decode(base64_str, validate=True)
    except Exception as exc:
        raise InvalidImageError(f"Invalid base64 encoding: {exc}") from exc

    if len(raw_bytes) > max_bytes:
        raise PayloadTooLargeError(f"Image size ({len(raw_bytes)} bytes) exceeds maximum limit of {max_bytes} bytes")

    # Decode binary buffer to OpenCV BGR matrix
    if cv2 is not None:
        np_arr = np.frombuffer(raw_bytes, dtype=np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is None or img.size == 0:
            raise InvalidImageError("Image buffer could not be decoded into a valid image matrix")
        return img
    else:
        # Fallback using PIL if cv2 is not present in runtime
        from io import BytesIO
        from PIL import Image, ImageFile
        ImageFile.LOAD_TRUNCATED_IMAGES = True
        try:
            pil_img = Image.open(BytesIO(raw_bytes)).convert("RGB")
            rgb = np.array(pil_img)
            return rgb[:, :, ::-1].copy()
        except Exception as exc:
            raise InvalidImageError(f"Failed to decode image buffer: {exc}") from exc

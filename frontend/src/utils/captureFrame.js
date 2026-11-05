// Purpose: Utility extracting base64 JPEG snapshot from video element

let offscreenCanvas = null;

/**
 * Captures the current frame from an active HTML5 video element.
 * @param {HTMLVideoElement} video - Active video element
 * @param {Object} options - Customization options
 * @param {number} [options.quality=0.8] - JPEG quality (0.0 to 1.0)
 * @param {number} [options.maxWidth=640] - Target frame width
 * @param {boolean} [options.stripPrefix=false] - Whether to strip 'data:image/jpeg;base64,' prefix
 * @returns {string|null} Base64 encoded JPEG image or null if video not ready
 */
export function captureFrame(video, options = {}) {
  if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
    return null;
  }

  const quality = options.quality ?? 0.8;
  const maxWidth = options.maxWidth ?? 640;
  const stripPrefix = options.stripPrefix ?? false;

  const aspect = video.videoHeight / video.videoWidth;
  const targetWidth = Math.min(maxWidth, video.videoWidth);
  const targetHeight = Math.round(targetWidth * aspect);

  if (!offscreenCanvas) {
    offscreenCanvas = document.createElement('canvas');
  }

  offscreenCanvas.width = targetWidth;
  offscreenCanvas.height = targetHeight;

  const ctx = offscreenCanvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

  const dataUrl = offscreenCanvas.toDataURL('image/jpeg', quality);

  if (stripPrefix) {
    return dataUrl.replace(/^data:image\/[a-z]+;base64,/, '');
  }

  return dataUrl;
}

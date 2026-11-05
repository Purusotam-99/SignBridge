// Purpose: Utility drawing hand landmarks and skeletal connections on overlay canvas

export const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index finger
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle finger
  [5, 9], [9, 10], [10, 11], [11, 12],
  // Ring finger
  [9, 13], [13, 14], [14, 15], [15, 16],
  // Pinky & Palm base
  [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]
];

const FINGERTIP_INDICES = [4, 8, 12, 16, 20];

/**
 * Draws hand landmarks and skeletal connections onto an overlay canvas.
 * Supports both array [[x, y], ...] and object [{x, y}, ...] formats.
 * @param {HTMLCanvasElement} canvas - The overlay canvas
 * @param {Array} rawLandmarks - Normalized landmark coordinates (0.0 to 1.0)
 * @param {Object} [options]
 */
export function drawLandmarks(canvas, rawLandmarks, options = {}) {
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  // Clear previous frame
  ctx.clearRect(0, 0, width, height);

  if (!rawLandmarks || rawLandmarks.length === 0) {
    return;
  }

  const {
    connectionColor = '#38bdf8', // Light sky blue
    connectionWidth = 2.5,
    jointColor = '#818cf8',      // Lavender indigo
    fingertipColor = '#34d399',  // Mint green
    jointRadius = 3.5,
    fingertipRadius = 5.5,
    mirror = false
  } = options;

  // Normalize landmarks to {x, y}
  const landmarks = rawLandmarks.map((item) => {
    if (Array.isArray(item)) {
      return { x: item[0], y: item[1] };
    }
    return { x: item.x, y: item.y };
  });

  const getCanvasCoords = (pt) => {
    const x = mirror ? (1 - pt.x) * width : pt.x * width;
    const y = pt.y * height;
    return { x, y };
  };

  ctx.save();

  // Draw skeletal lines
  ctx.lineWidth = connectionWidth;
  ctx.strokeStyle = connectionColor;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
    const startPt = landmarks[startIdx];
    const endPt = landmarks[endIdx];

    if (startPt && endPt) {
      const p1 = getCanvasCoords(startPt);
      const p2 = getCanvasCoords(endPt);

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  }

  // Draw landmark points
  landmarks.forEach((pt, idx) => {
    if (!pt) return;
    const { x, y } = getCanvasCoords(pt);
    const isFingertip = FINGERTIP_INDICES.includes(idx);

    ctx.beginPath();
    ctx.arc(x, y, isFingertip ? fingertipRadius : jointRadius, 0, 2 * Math.PI);

    if (isFingertip) {
      ctx.fillStyle = fingertipColor;
    } else {
      ctx.fillStyle = jointColor;
    }

    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
  });

  ctx.restore();
}

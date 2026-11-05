// Purpose: Centralized API client for all backend network requests
import { API_BASE_URL, SUPPORTED_LETTERS } from '../config/constants';

/**
 * Normalizes backend prediction response to ensure consistent fields.
 * Handles both { hand_detected, probabilities } and { detected, top_predictions }.
 */
function normalizePredictionResponse(data) {
  const handDetected = Boolean(data.hand_detected ?? data.detected);
  const letter = data.letter || null;
  const confidence = typeof data.confidence === 'number' ? data.confidence : 0;

  // Normalize probabilities into both an object and a sorted top-predictions list
  let probabilities = data.probabilities || {};
  let topPredictions = [];

  if (Array.isArray(data.top_predictions)) {
    topPredictions = data.top_predictions;
    if (Object.keys(probabilities).length === 0) {
      topPredictions.forEach((p) => {
        probabilities[p.letter] = p.confidence;
      });
    }
  } else if (typeof probabilities === 'object') {
    topPredictions = SUPPORTED_LETTERS.map((lbl) => ({
      letter: lbl,
      confidence: typeof probabilities[lbl] === 'number' ? probabilities[lbl] : 0
    })).sort((a, b) => b.confidence - a.confidence);
  }

  return {
    hand_detected: handDetected,
    detected: handDetected,
    letter,
    confidence,
    probabilities,
    top_predictions: topPredictions,
    landmarks: data.landmarks || [],
    is_simulated: Boolean(data.is_simulated)
  };
}

/**
 * Simulates a realistic ISL prediction when in Demo Mode (Backend Offline).
 */
export function generateDemoPrediction() {
  const detected = Math.random() > 0.15; // 85% chance of hand detected
  if (!detected) {
    return {
      hand_detected: false,
      detected: false,
      letter: null,
      confidence: 0,
      probabilities: { A: 0.05, B: 0.05, C: 0.05 },
      top_predictions: SUPPORTED_LETTERS.map((l) => ({ letter: l, confidence: 0.05 })),
      landmarks: [],
      is_simulated: true
    };
  }

  const randomLetter = SUPPORTED_LETTERS[Math.floor(Math.random() * SUPPORTED_LETTERS.length)];
  const primaryConfidence = parseFloat((0.82 + Math.random() * 0.15).toFixed(3));
  const remaining = parseFloat(((1 - primaryConfidence) / (SUPPORTED_LETTERS.length - 1)).toFixed(3));

  const probs = {};
  SUPPORTED_LETTERS.forEach((l) => {
    probs[l] = l === randomLetter ? primaryConfidence : remaining;
  });

  // Simulated 21 hand landmarks for canvas drawing
  const landmarks = Array.from({ length: 21 }, (_, i) => [
    0.5 + 0.25 * Math.cos((i / 21) * Math.PI * 2),
    0.5 + 0.25 * Math.sin((i / 21) * Math.PI * 2)
  ]);

  return normalizePredictionResponse({
    hand_detected: true,
    letter: randomLetter,
    confidence: primaryConfidence,
    probabilities: probs,
    landmarks,
    is_simulated: true
  });
}

/**
 * Sends a captured frame to the backend sign classifier.
 * @param {string} imageBase64 - Base64 encoded JPEG data URL
 * @param {boolean} [demoMode=false] - Whether demo mode is active
 * @returns {Promise<Object>}
 */
export async function predict(imageBase64, demoMode = false) {
  if (demoMode) {
    return generateDemoPrediction();
  }

  const response = await fetch(`${API_BASE_URL}/api/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image: imageBase64 }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Prediction failed with HTTP ${response.status}`);
  }

  const data = await response.json();
  return normalizePredictionResponse(data);
}

/**
 * Fetches offline model evaluation metrics from GET /api/metrics.
 * Strictly returns { available: false } if backend is unavailable or not evaluated.
 * Never fabricates numbers.
 * @returns {Promise<Object>}
 */
export async function getMetrics() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/metrics`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return { available: false, message: 'Evaluation pending' };
    }

    const data = await response.json();
    return data;
  } catch {
    return { available: false, message: 'Evaluation pending' };
  }
}

/**
 * Checks server connectivity and model status.
 * @returns {Promise<Object>}
 */
export async function getHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return { status: 'offline', isOnline: false };
    }

    const data = await response.json();
    return { ...data, isOnline: true };
  } catch {
    return { status: 'offline', isOnline: false };
  }
}

// Purpose: Centralized API client for all backend network requests
import { API_BASE_URL, SUPPORTED_LETTERS } from '../config/constants';
import { normalizeConfidenceScore } from '../utils/confidence';

let demoCycleCount = 0;
let demoCurrentIndex = 0;

/**
 * Normalizes backend prediction response to ensure consistent fields.
 * Handles both { hand_detected, probabilities } and { detected, top_predictions }.
 */
function normalizePredictionResponse(data) {
  const handDetected = Boolean(data.hand_detected ?? data.detected);
  const letter = data.letter || null;
  const rawConfidence = typeof data.confidence === 'number' ? data.confidence : 0;
  const confidence = normalizeConfidenceScore(rawConfidence);

  // Normalize probabilities into both an object and a sorted top-predictions list
  let probabilities = data.probabilities || {};
  let topPredictions = [];

  if (Array.isArray(data.top_predictions)) {
    topPredictions = data.top_predictions;
    if (Object.keys(probabilities).length === 0) {
      topPredictions.forEach((p) => {
        probabilities[p.letter] = normalizeConfidenceScore(p.confidence);
      });
    }
  } else if (typeof probabilities === 'object') {
    topPredictions = SUPPORTED_LETTERS.map((lbl) => ({
      letter: lbl,
      confidence: typeof probabilities[lbl] === 'number' ? normalizeConfidenceScore(probabilities[lbl]) : 0
    })).sort((a, b) => b.confidence - a.confidence);
  }

  return {
    hand_detected: handDetected,
    detected: handDetected,
    letter,
    confidence,
    raw_confidence: rawConfidence,
    probabilities,
    top_predictions: topPredictions,
    landmarks: data.landmarks || [],
    is_simulated: Boolean(data.is_simulated)
  };
}

/**
 * Simulates a realistic ISL prediction when in Demo Mode (Backend Offline).
 * Demonstrates the 2-second hold-to-confirm pattern with smooth release gaps.
 */
export function generateDemoPrediction() {
  demoCycleCount += 1;
  const patternIndex = demoCycleCount % 11;
  const isReleaseGap = patternIndex >= 9; // 2 frames (~600ms) gap between letters

  if (isReleaseGap) {
    if (patternIndex === 10) {
      demoCurrentIndex = (demoCurrentIndex + 1) % SUPPORTED_LETTERS.length;
    }
    return {
      hand_detected: false,
      detected: false,
      letter: null,
      confidence: 0,
      raw_confidence: 0,
      probabilities: { A: 0.05, B: 0.05, C: 0.05 },
      top_predictions: SUPPORTED_LETTERS.map((l) => ({ letter: l, confidence: 0.05 })),
      landmarks: [],
      is_simulated: true
    };
  }

  const currentLetter = SUPPORTED_LETTERS[demoCurrentIndex];
  // Stable high confidence (~88%) for realistic hold demonstration
  const primaryConfidence = parseFloat((0.88 + Math.sin(demoCycleCount) * 0.04).toFixed(3));
  const remaining = parseFloat(((1 - primaryConfidence) / (SUPPORTED_LETTERS.length - 1)).toFixed(3));

  const probs = {};
  SUPPORTED_LETTERS.forEach((l) => {
    probs[l] = l === currentLetter ? primaryConfidence : remaining;
  });

  // Simulated 21 hand landmarks for canvas drawing
  const landmarks = Array.from({ length: 21 }, (_, i) => [
    0.5 + 0.22 * Math.cos((i / 21) * Math.PI * 2),
    0.5 + 0.22 * Math.sin((i / 21) * Math.PI * 2)
  ]);

  return normalizePredictionResponse({
    hand_detected: true,
    letter: currentLetter,
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
    const response = await fetch(`${API_BASE_URL}/api/metrics?t=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return { available: false, message: 'Evaluation pending' };
    }

    const data = await response.json();
    if (!data || !data.available) {
      return { available: false, message: 'Evaluation pending' };
    }

    const perClass = data.per_class || data.classification_report || {};
    const normalizedReport = {};
    Object.keys(perClass).forEach((key) => {
      const item = perClass[key] || {};
      normalizedReport[key] = {
        ...item,
        precision: item.precision ?? 0,
        recall: item.recall ?? 0,
        'f1-score': item['f1-score'] ?? item.f1 ?? 0,
        f1: item.f1 ?? item['f1-score'] ?? 0,
      };
    });

    return {
      ...data,
      available: true,
      accuracy: typeof data.accuracy === 'number' ? data.accuracy : 0,
      precision: data.precision ?? data.macro_precision ?? 0,
      recall: data.recall ?? data.macro_recall ?? 0,
      f1: data.f1 ?? data.macro_f1 ?? 0,
      macro_precision: data.macro_precision ?? data.precision ?? 0,
      macro_recall: data.macro_recall ?? data.recall ?? 0,
      macro_f1: data.macro_f1 ?? data.f1 ?? 0,
      classification_report: normalizedReport,
      per_class: normalizedReport,
      classes: data.classes || data.labels || ['A', 'B', 'C'],
      labels: data.labels || data.classes || ['A', 'B', 'C'],
    };
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

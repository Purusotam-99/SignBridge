// Purpose: Application constants, thresholds, frame intervals, and configuration flags

// Supported vocabulary is strictly limited to ISL letters A, B, and C
export const SUPPORTED_LETTERS = ['A', 'B', 'C'];

export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.80,    // >= 80% (Green)
  MEDIUM: 0.50,  // 50% - 79% (Amber)
  LOW: 0.00      // < 50% (Red)
};

// Capture frame every ~500ms as per task specification
export const FRAME_INTERVAL_MS = 500;

export const AUTO_APPEND_CONSECUTIVE_FRAMES = 3;

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const DISCLAIMER_NOTE = 'Letter-by-letter fingerspelling only. This is not full ISL sentence translation.';

export const SIGN_INFO = {
  A: {
    letter: 'A',
    name: 'Sign A',
    description: 'Fingers curled into a closed fist with thumb upright alongside the index finger.',
    image: '/signs/A.png',
  },
  B: {
    letter: 'B',
    name: 'Sign B',
    description: 'Flat open palm facing forward with four fingers held together straight up and thumb tucked.',
    image: '/signs/B.png',
  },
  C: {
    letter: 'C',
    name: 'Sign C',
    description: 'Fingers and thumb curved into an open C-shape arc facing sideways.',
    image: '/signs/C.png',
  }
};

export const NAVIGATION_LINKS = [
  { path: '/', label: 'Dashboard' },
  { path: '/live', label: 'Live Recognition' },
  { path: '/text-to-sign', label: 'Text to Sign' },
  { path: '/analytics', label: 'Analytics' }
];

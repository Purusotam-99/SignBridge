// Purpose: Application constants, thresholds, frame intervals, and configuration flags

// Supported vocabulary is strictly limited to ISL letters A, B, and C
export const SUPPORTED_LETTERS = ['A', 'B', 'C'];

export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.80,    // >= 80% (Green)
  MEDIUM: 0.60,  // 60% - 79% (Amber / acceptable for hold)
  LOW: 0.00      // < 60% (Red)
};

// Hold-to-confirm timing and confidence constants
export const HOLD_DURATION_MS = 2000;      // 2 seconds hold time required to confirm letter
export const MIN_CONFIDENCE = 0.60;         // Minimum confidence to count as valid hold frame
export const DROPOUT_GRACE_MS = 500;       // Tolerate momentary flicker or missing frame for up to 500ms
export const RELEASE_GAP_MS = 600;         // Hand absence or sign switch required before next append
export const FRAME_INTERVAL_MS = 300;      // Responsive self-scheduling loop delay between frame cycles
export const AUTO_APPEND_CONSECUTIVE_FRAMES = 3; // Legacy fallback

export const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:5000';

export const DISCLAIMER_NOTE = 'Letter-by-letter fingerspelling only. This is not full ISL sentence translation.';

export const SIGN_INFO = {
  A: {
    letter: 'A',
    name: 'Sign A',
    hint: 'Fingertips meeting at peak',
    description: 'Touch index fingertips together at the peak with hands angled in an inverted V / A-frame roof.',
    image: '/signs/A.png',
  },
  B: {
    letter: 'B',
    name: 'Sign B',
    hint: '4 fingers upright, thumb tucked',
    description: 'Flat open palm facing forward with four fingers held together straight up and thumb folded across palm.',
    image: '/signs/B.png',
  },
  C: {
    letter: 'C',
    name: 'Sign C',
    hint: 'Fingers & thumb curved in C-arc',
    description: 'Fingers and thumb curved smoothly forward into an open C-shape arch with an open gap.',
    image: '/signs/C.png',
  }
};

export const NAVIGATION_LINKS = [
  { path: '/', label: 'Dashboard' },
  { path: '/live', label: 'Live Recognition' },
  { path: '/text-to-sign', label: 'Text to Sign' },
  { path: '/analytics', label: 'Analytics' }
];

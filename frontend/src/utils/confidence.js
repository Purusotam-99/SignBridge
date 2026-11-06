// Purpose: Helper utility mapping numerical confidence to tiers (High, Medium, Low)
import { CONFIDENCE_THRESHOLDS } from '../config/constants.js';

/**
 * Normalizes confidence score: if > 1, divides by 100 to guarantee 0.0 - 1.0 float.
 * @param {number} score
 * @returns {number}
 */
export function normalizeConfidenceScore(score = 0) {
  if (typeof score !== 'number' || isNaN(score)) return 0;
  let normalized = score;
  if (normalized > 1) {
    normalized = normalized / 100;
  }
  return Math.max(0, Math.min(1, normalized));
}

/**
 * Returns the tier label based on numerical confidence score.
 * High: >= 80%, Medium: 60% - 79%, Low: < 60%
 * @param {number} score - Float between 0.0 and 1.0
 * @returns {'High' | 'Medium' | 'Low'}
 */
export function getConfidenceTier(score = 0) {
  const norm = normalizeConfidenceScore(score);
  if (norm >= CONFIDENCE_THRESHOLDS.HIGH) {
    return 'High';
  }
  if (norm >= CONFIDENCE_THRESHOLDS.MEDIUM) {
    return 'Medium';
  }
  return 'Low';
}

/**
 * Returns pastel light style configuration for confidence tiers.
 * @param {number} score - Float between 0.0 and 1.0
 * @returns {{ tier: string, text: string, bg: string, border: string, badge: string, bar: string, dot: string }}
 */
export function getConfidenceStyles(score = 0) {
  const tier = getConfidenceTier(score);

  switch (tier) {
    case 'High':
      return {
        tier: 'High',
        text: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        bar: 'bg-emerald-500',
        dot: 'bg-emerald-500'
      };
    case 'Medium':
      return {
        tier: 'Medium',
        text: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
        bar: 'bg-amber-500',
        dot: 'bg-amber-500'
      };
    case 'Low':
    default:
      return {
        tier: 'Low',
        text: 'text-rose-700',
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        badge: 'bg-rose-50 text-rose-700 border-rose-200',
        bar: 'bg-rose-500',
        dot: 'bg-rose-500'
      };
  }
}

/**
 * Formats a decimal confidence score into a displayable percentage.
 * @param {number} score - Float between 0.0 and 1.0
 * @returns {string} e.g. "93%" or "84.2%"
 */
export function formatConfidencePercent(score = 0) {
  const pct = Math.max(0, Math.min(100, Math.round(score * 100)));
  return `${pct}%`;
}

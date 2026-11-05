// Purpose: Helper utility mapping numerical confidence to tiers (High, Medium, Low)
import { CONFIDENCE_THRESHOLDS } from '../config/constants';

/**
 * Returns the tier label based on numerical confidence score.
 * High: >= 80%, Medium: 50% - 79%, Low: < 50%
 * @param {number} score - Float between 0.0 and 1.0
 * @returns {'High' | 'Medium' | 'Low'}
 */
export function getConfidenceTier(score = 0) {
  if (score >= CONFIDENCE_THRESHOLDS.HIGH) {
    return 'High';
  }
  if (score >= CONFIDENCE_THRESHOLDS.MEDIUM) {
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

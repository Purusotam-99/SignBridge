// Purpose: Progress bar visualization for prediction confidence level
import React from 'react';
import { getConfidenceStyles, formatConfidencePercent } from '../../utils/confidence';

export default function ConfidenceBar({
  confidence = 0,
  showPercentage = true,
  showTier = true,
  className = ''
}) {
  const styles = getConfidenceStyles(confidence);
  const percentage = Math.max(0, Math.min(100, Math.round(confidence * 100)));

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium">Confidence</span>
        <div className="flex items-center space-x-1.5">
          {showTier && (
            <span className={`text-[11px] font-semibold px-1.5 py-0.2 rounded border ${styles.badge}`}>
              {styles.tier}
            </span>
          )}
          {showPercentage && (
            <span className="font-mono text-slate-700 font-semibold">
              {formatConfidencePercent(confidence)}
            </span>
          )}
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">
        <div
          className={`h-full rounded-full transition-all duration-300 ${styles.bar}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

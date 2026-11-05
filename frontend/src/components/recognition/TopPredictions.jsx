// Purpose: Displays top-3 probability candidate bars for A, B, and C
import React from 'react';
import { SUPPORTED_LETTERS } from '../../config/constants';
import { formatConfidencePercent } from '../../utils/confidence';

export default function TopPredictions({ probabilities = {}, topPredictions = [] }) {
  // Normalize candidate list
  const candidates = SUPPORTED_LETTERS.map((letter) => {
    let conf = 0;
    if (typeof probabilities[letter] === 'number') {
      conf = probabilities[letter];
    } else {
      const match = topPredictions.find((p) => p.letter === letter);
      if (match) conf = match.confidence;
    }
    return {
      letter,
      confidence: conf
    };
  }).sort((a, b) => b.confidence - a.confidence);

  return (
    <div className="space-y-2 pt-2 border-t border-slate-100">
      <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 uppercase tracking-wider">
        <span>Class Probabilities</span>
        <span>Softmax</span>
      </div>

      <div className="space-y-1.5">
        {candidates.map(({ letter, confidence }, idx) => {
          const pct = Math.max(0, Math.min(100, Math.round(confidence * 100)));
          const isTop = idx === 0 && confidence > 0.3;

          return (
            <div key={letter} className="space-y-0.5">
              <div className="flex items-center justify-between text-xs">
                <span className={`font-medium ${isTop ? 'text-indigo-700 font-bold' : 'text-slate-600'}`}>
                  Sign {letter}
                </span>
                <span className="font-mono text-[11px] text-slate-500">
                  {formatConfidencePercent(confidence)}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isTop ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                  style={{ width: `${Math.max(2, pct)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Purpose: Styled 3x3 grid heatmap confusion matrix with "Evaluation pending" fallback
import React from 'react';
import { Grid, AlertCircle } from 'lucide-react';
import Card from '../common/Card';
import { SUPPORTED_LETTERS } from '../../config/constants';

export default function ConfusionMatrix({
  matrix = null,
  labels = SUPPORTED_LETTERS,
  isPending = false
}) {
  const defaultLabels = labels && labels.length === 3 ? labels : SUPPORTED_LETTERS;

  return (
    <Card
      title="Confusion Matrix (A / B / C)"
      subtitle="Predicted vs Actual classifications on test holdout set"
      icon={<Grid className="w-4 h-4 text-slate-600" />}
      bodyClassName="p-4 sm:p-5"
    >
      {isPending || !matrix ? (
        <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50/70 border border-dashed border-slate-200 rounded-xl p-6">
          <AlertCircle className="w-6 h-6 text-amber-500 mb-2" />
          <h4 className="text-sm font-semibold text-slate-800">Evaluation pending</h4>
          <p className="text-xs text-slate-500 max-w-xs mt-1">
            Run the offline test evaluation script (<code className="font-mono text-[11px] bg-slate-200 px-1 py-0.5 rounded">python ml/evaluate.py</code>) to populate verified confusion matrix results.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-2">
          {/* Predicted Label Header */}
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-14">
            Predicted Class
          </div>

          <div className="flex items-center">
            {/* Actual Label Y Axis */}
            <div className="w-12 text-[11px] font-semibold text-slate-500 uppercase tracking-wider -rotate-90 text-center whitespace-nowrap">
              Actual Class
            </div>

            {/* Matrix Table */}
            <div>
              {/* Column labels */}
              <div className="grid grid-cols-3 gap-2 mb-2 text-center ml-10">
                {defaultLabels.map((lbl) => (
                  <div key={lbl} className="w-16 font-bold text-xs text-slate-700">
                    Sign {lbl}
                  </div>
                ))}
              </div>

              {/* Rows */}
              <div className="space-y-2">
                {matrix.map((row, rIdx) => {
                  const actualLbl = defaultLabels[rIdx] || `R${rIdx}`;
                  return (
                    <div key={rIdx} className="flex items-center space-x-2">
                      <div className="w-8 font-bold text-xs text-slate-700 text-right pr-2">
                        {actualLbl}
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {row.map((val, cIdx) => {
                          const isDiagonal = rIdx === cIdx;
                          let cellStyle = 'bg-slate-50 text-slate-400 border-slate-200';

                          if (isDiagonal && val > 0) {
                            cellStyle = 'bg-emerald-50 text-emerald-800 font-bold border-emerald-300 shadow-2xs';
                          } else if (!isDiagonal && val > 0) {
                            cellStyle = 'bg-rose-50 text-rose-700 font-bold border-rose-300';
                          }

                          return (
                            <div
                              key={cIdx}
                              title={`Actual: ${actualLbl}, Predicted: ${defaultLabels[cIdx]}: ${val} instances`}
                              className={`w-16 h-12 rounded-lg border flex flex-col items-center justify-center transition-transform hover:scale-105 ${cellStyle}`}
                            >
                              <span className="text-sm font-mono">{val}</span>
                              <span className="text-[9px] uppercase tracking-wider opacity-75">
                                {isDiagonal ? 'Match' : 'Error'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center space-x-5 mt-4 text-[11px] text-slate-500">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-emerald-50 border border-emerald-300" />
              <span>Correct match</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-rose-50 border border-rose-300" />
              <span>Misclassification</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

// Purpose: Displays big predicted letter, confidence badge, progress bar, top-3 probabilities, and status line
import React from 'react';
import { Target } from 'lucide-react';
import Card from '../common/Card';
import StatusBadge from '../common/StatusBadge';
import ConfidenceBar from './ConfidenceBar';
import TopPredictions from './TopPredictions';
import { getConfidenceTier } from '../../utils/confidence';

export default function PredictionPanel({
  prediction,
  isRecognizing = false
}) {
  const isHandDetected = Boolean(prediction?.hand_detected || prediction?.detected);
  const letter = prediction?.letter;
  const confidence = prediction?.confidence || 0;
  const tier = getConfidenceTier(confidence);

  // Status line text
  let statusLine = 'Waiting for hand gesture…';
  if (isRecognizing) {
    if (isHandDetected && letter) {
      statusLine = `Successfully predicted letter '${letter}'`;
    } else {
      statusLine = 'No hand detected';
    }
  } else {
    statusLine = 'Start recognition to detect signs';
  }

  const badgeStatus = isHandDetected && letter
    ? (tier === 'High' ? 'high' : tier === 'Medium' ? 'medium' : 'low')
    : 'neutral';

  return (
    <Card
      title="ISL Prediction"
      subtitle="Classified from alphabet vocabulary (A, B, C)"
      icon={<Target className="w-4 h-4 text-slate-600" />}
      action={
        <StatusBadge
          status={badgeStatus}
          label={isHandDetected && letter ? `${tier} Confidence` : 'Idle'}
          size="xs"
        />
      }
      bodyClassName="p-4 sm:p-5 space-y-4"
    >
      {/* Center Block: Big Predicted Letter */}
      <div className="flex flex-col items-center justify-center py-2 text-center">
        <div className="w-24 h-24 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center shadow-xs">
          <span className="text-6xl font-black tracking-tight text-slate-800">
            {isHandDetected && letter ? letter : '—'}
          </span>
        </div>
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-2">
          Predicted Letter
        </span>
      </div>

      {/* Confidence % with Progress Bar */}
      <ConfidenceBar confidence={confidence} />

      {/* Top-3 probabilities as small bars */}
      <TopPredictions
        probabilities={prediction?.probabilities}
        topPredictions={prediction?.top_predictions}
      />

      {/* Status Line */}
      <div className="pt-2 border-t border-slate-100 flex items-center text-xs text-slate-600">
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${
            isHandDetected && letter ? 'bg-emerald-500' : 'bg-slate-400'
          }`}
        />
        <span className="font-medium truncate">{statusLine}</span>
      </div>
    </Card>
  );
}

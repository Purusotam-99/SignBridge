// Purpose: Displays big predicted letter, confidence badge, hold progress bar, top-3 probabilities, and live status
import React from 'react';
import { Target, CheckCircle2, AlertTriangle, Clock, Lock } from 'lucide-react';
import Card from '../common/Card';
import StatusBadge from '../common/StatusBadge';
import ConfidenceBar from './ConfidenceBar';
import TopPredictions from './TopPredictions';
import { getConfidenceTier } from '../../utils/confidence';
import { useRecognitionContext } from '../../context/RecognitionContext';

export default function PredictionPanel({
  prediction,
  isRecognizing = false
}) {
  const { holdState, errorMessage } = useRecognitionContext();

  const isHandDetected = Boolean(prediction?.hand_detected || prediction?.detected);
  const letter = prediction?.letter;
  const confidence = prediction?.confidence || 0;
  const tier = getConfidenceTier(confidence);

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
      {/* Center Block: Big Predicted Letter with Candidate Highlight */}
      <div className="flex flex-col items-center justify-center py-1 text-center relative">
        <div className={`w-24 h-24 rounded-2xl bg-slate-50 border flex items-center justify-center shadow-xs transition-all duration-200 ${
          holdState.isLocked
            ? 'border-emerald-400 bg-emerald-50/40 ring-2 ring-emerald-500/20'
            : holdState.candidate
            ? 'border-indigo-300 bg-indigo-50/20 ring-2 ring-indigo-500/10'
            : 'border-slate-200/80'
        }`}>
          <span className="text-6xl font-black tracking-tight text-slate-800">
            {isHandDetected && letter ? letter : '—'}
          </span>
        </div>
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-2">
          Predicted Letter
        </span>
      </div>

      {/* Hold-to-Confirm Progress Bar (0 -> 100% over 2.0s) */}
      {isRecognizing && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center space-x-1.5">
              {holdState.isLocked ? (
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
              )}
              <span>Hold to Confirm</span>
              {holdState.candidate && (
                <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 font-mono font-bold text-[10px]">
                  '{holdState.candidate}'
                </span>
              )}
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              {holdState.isLocked
                ? 'Locked (Release hand)'
                : holdState.candidate
                ? `${((holdState.requiredMs - holdState.heldMs) / 1000).toFixed(1)}s remaining`
                : 'Need 2.0s hold'}
            </span>
          </div>

          {/* Progress bar track */}
          <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-150 rounded-full ${
                holdState.isLocked
                  ? 'bg-emerald-500'
                  : holdState.progress > 0.7
                  ? 'bg-indigo-600'
                  : 'bg-indigo-400'
              }`}
              style={{ width: `${Math.round(holdState.progress * 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="truncate font-medium">{holdState.statusReason}</span>
            <span className="font-mono text-[10px] text-slate-400">
              {Math.round(holdState.progress * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Confidence % with Progress Bar */}
      <ConfidenceBar confidence={confidence} />

      {/* Top-3 probabilities as small bars */}
      <TopPredictions
        probabilities={prediction?.probabilities}
        topPredictions={prediction?.top_predictions}
      />

      {/* Bottom Live Status Line with Error Fallback */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center text-slate-600 min-w-0">
          <span
            className={`inline-block w-2 h-2 rounded-full mr-2 shrink-0 ${
              errorMessage
                ? 'bg-rose-500 animate-pulse'
                : holdState.isLocked
                ? 'bg-emerald-500'
                : isHandDetected && letter
                ? 'bg-indigo-500'
                : 'bg-slate-400'
            }`}
          />
          <span className="font-medium truncate">
            {errorMessage ? (
              <span className="text-rose-600">{errorMessage}</span>
            ) : (
              holdState.statusReason || (isHandDetected ? `Detected sign '${letter}'` : 'Waiting for hand gesture…')
            )}
          </span>
        </div>
      </div>
    </Card>
  );
}

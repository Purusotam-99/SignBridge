// Purpose: Real-time debug telemetry panel displaying live backend responses, hold timing, lock status, and latency
import React from 'react';
import { Terminal, Activity, Clock, Lock, Unlock, Cpu, AlertCircle, X } from 'lucide-react';
import Card from '../common/Card';
import StatusBadge from '../common/StatusBadge';
import { useRecognitionContext } from '../../context/RecognitionContext';

export default function DebugPanel() {
  const {
    isDebugMode,
    setIsDebugMode,
    debugInfo,
    holdState,
    activePrediction,
    connectionStatus
  } = useRecognitionContext();

  if (!isDebugMode) return null;

  const rawJson = debugInfo?.rawResponse
    ? JSON.stringify(
        {
          hand_detected: debugInfo.rawResponse.hand_detected,
          letter: debugInfo.rawResponse.letter,
          confidence: debugInfo.rawResponse.confidence,
          probabilities: debugInfo.rawResponse.probabilities,
          landmarks_count: debugInfo.rawResponse.landmarks?.length || 0,
          is_simulated: debugInfo.rawResponse.is_simulated
        },
        null,
        2
      )
    : 'Waiting for frame cycle…';

  return (
    <Card
      title="Live Recognition Telemetry"
      subtitle="Deep diagnostic inspection (?debug=1)"
      icon={<Terminal className="w-4 h-4 text-indigo-600" />}
      action={
        <div className="flex items-center space-x-2">
          <StatusBadge
            status={debugInfo.isLocked ? 'warning' : 'active'}
            label={debugInfo.isLocked ? 'LOCKED' : 'UNLOCKED'}
            icon={debugInfo.isLocked ? <Lock className="w-3 h-3 text-amber-600" /> : <Unlock className="w-3 h-3 text-emerald-600" />}
            size="xs"
          />
          <button
            type="button"
            onClick={() => setIsDebugMode(false)}
            aria-label="Close debug telemetry"
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      }
      bodyClassName="p-4 space-y-3 font-mono text-xs"
    >
      {/* Real-time Telemetry Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Candidate</span>
          <span className="text-base font-bold text-indigo-700">
            {debugInfo.candidate || '—'}
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Held Duration</span>
          <span className="text-base font-bold text-slate-800">
            {debugInfo.heldMs}ms <span className="text-xs font-normal text-slate-400">/ 2000ms</span>
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Norm Confidence</span>
          <span className="text-base font-bold text-emerald-600">
            {(debugInfo.normalizedConfidence * 100).toFixed(1)}%
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Network Latency</span>
          <span className="text-base font-bold text-sky-600">
            {debugInfo.latencyMs}ms
          </span>
        </div>
      </div>

      {/* Decision Log Row */}
      <div className="bg-slate-900 text-slate-200 rounded-lg p-2.5 text-[11px] flex items-center space-x-2">
        <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span className="text-slate-400 font-sans">Decision:</span>
        <span className="text-emerald-300 font-mono truncate">{debugInfo.lastDecision}</span>
      </div>

      {/* Raw Payload Stream */}
      <div>
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
          Last Raw Backend Response
        </span>
        <pre className="p-2.5 bg-slate-950 text-slate-300 rounded-lg overflow-x-auto text-[10px] max-h-36 leading-relaxed border border-slate-800">
          {rawJson}
        </pre>
      </div>
    </Card>
  );
}

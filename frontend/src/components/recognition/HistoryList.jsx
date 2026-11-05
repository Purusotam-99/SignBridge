// Purpose: Full-width Recognition History card displaying past predictions with time, letter, and confidence
import React from 'react';
import { History, Trash2, Clock } from 'lucide-react';
import Card from '../common/Card';
import StatusBadge from '../common/StatusBadge';
import EmptyState from '../common/EmptyState';
import { useRecognitionContext } from '../../context/RecognitionContext';
import { getConfidenceTier, formatConfidencePercent } from '../../utils/confidence';

export default function HistoryList() {
  const { history, clearHistory } = useRecognitionContext();

  return (
    <Card
      title="Recognition History"
      subtitle="Chronological log of past ISL alphabet predictions"
      icon={<History className="w-4 h-4 text-slate-600" />}
      action={
        history.length > 0 && (
          <button
            type="button"
            onClick={clearHistory}
            aria-label="Clear history log"
            className="inline-flex items-center text-xs text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1 text-slate-400" />
            Clear
          </button>
        )
      }
      bodyClassName="p-4 sm:p-5"
    >
      {history.length === 0 ? (
        <EmptyState
          icon={<Clock className="w-5 h-5" />}
          title="No recognitions yet"
          description="Start the camera to see results."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100 uppercase tracking-wider text-[10px] text-slate-500">
              <tr>
                <th scope="col" className="px-3 py-2 font-semibold">Timestamp</th>
                <th scope="col" className="px-3 py-2 font-semibold">Predicted Sign</th>
                <th scope="col" className="px-3 py-2 font-semibold">Confidence</th>
                <th scope="col" className="px-3 py-2 font-semibold">Classification Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((item) => {
                const tier = getConfidenceTier(item.confidence);
                const badgeStatus = tier === 'High' ? 'high' : tier === 'Medium' ? 'medium' : 'low';

                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-3 py-2.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {item.timestamp}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-indigo-50 border border-indigo-100 font-bold text-indigo-700 text-xs">
                        {item.letter}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono font-medium text-slate-700 whitespace-nowrap">
                      {formatConfidencePercent(item.confidence)}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <StatusBadge
                        status={badgeStatus}
                        label={tier}
                        size="xs"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

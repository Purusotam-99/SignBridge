// Purpose: Key performance indicator card for ML model metrics with "Evaluation pending" state
import React from 'react';
import Card from '../common/Card';

export default function MetricCard({
  title,
  value,
  description,
  icon,
  isPending = false
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {icon && (
          <div className="text-slate-400">
            {icon}
          </div>
        )}
      </div>

      <div>
        {isPending ? (
          <span className="text-base font-semibold text-amber-600 block">
            Evaluation pending
          </span>
        ) : (
          <span className="text-2xl font-bold text-slate-900 tracking-tight block">
            {value}
          </span>
        )}
      </div>

      {description && (
        <p className="text-[11px] text-slate-500 leading-tight">
          {description}
        </p>
      )}
    </div>
  );
}

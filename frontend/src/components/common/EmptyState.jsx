// Purpose: Reusable empty state view with placeholder icon and message
import React from 'react';

export default function EmptyState({
  icon,
  title = 'No recognitions yet',
  description = 'Start the camera to see results.',
  action = null,
  className = ''
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-6 sm:p-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/60 ${className}`}
    >
      {icon && (
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 mb-2.5 border border-slate-200/80 shadow-sm">
          {icon}
        </div>
      )}
      <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
      {description && (
        <p className="mt-1 text-xs text-slate-500 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-3.5">{action}</div>}
    </div>
  );
}

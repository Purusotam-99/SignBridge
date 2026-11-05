// Purpose: Small pill status badge for state indicators and confidence levels
import React from 'react';

export default function StatusBadge({
  status = 'neutral',
  label,
  pulse = false,
  icon,
  size = 'sm',
  className = ''
}) {
  const getVariantStyles = () => {
    switch (status) {
      case 'success':
      case 'high':
      case 'active':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500'
        };
      case 'warning':
      case 'medium':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500'
        };
      case 'danger':
      case 'error':
      case 'low':
      case 'disconnected':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500'
        };
      case 'processing':
      case 'info':
        return {
          bg: 'bg-sky-50 text-sky-700 border-sky-200',
          dot: 'bg-sky-500'
        };
      case 'connected':
      case 'lavender':
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          dot: 'bg-indigo-500'
        };
      case 'idle':
      case 'neutral':
      default:
        return {
          bg: 'bg-slate-100 text-slate-600 border-slate-200',
          dot: 'bg-slate-400'
        };
    }
  };

  const { bg, dot } = getVariantStyles();
  const sizeClasses = size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center space-x-1.5 font-medium rounded-full border ${bg} ${sizeClasses} ${className}`}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dot}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dot}`} />
        </span>
      )}
      {!pulse && <span className={`inline-block h-1.5 w-1.5 rounded-full ${dot}`} />}
      {icon && <span className="mr-0.5">{icon}</span>}
      <span>{label}</span>
    </span>
  );
}

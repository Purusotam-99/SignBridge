// Purpose: Accessible icon button component with visible focus states and aria labels
import React from 'react';

export default function IconButton({
  icon,
  onClick,
  label,
  ariaLabel,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  className = '',
  title
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm border border-indigo-700 focus:ring-indigo-500';
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm border border-rose-700 focus:ring-rose-500';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border border-emerald-700 focus:ring-emerald-500';
      case 'ghost':
        return 'bg-transparent hover:bg-slate-100 text-slate-600 focus:ring-slate-400';
      case 'secondary':
      default:
        return 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm focus:ring-slate-400';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-2.5 py-1.5 text-xs';
      case 'lg':
        return 'px-4 py-2.5 text-base';
      case 'md':
      default:
        return 'px-3 py-2 text-sm';
    }
  };

  const accessibleName = ariaLabel || label || title || 'button';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title || label}
      aria-label={accessibleName}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${getVariantStyles()} ${getSizeStyles()} ${className}`}
    >
      {icon}
      {label && <span className={icon ? 'ml-1.5' : ''}>{label}</span>}
    </button>
  );
}

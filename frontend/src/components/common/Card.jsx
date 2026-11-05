// Purpose: Reusable white card component with rounded-xl border and subtle shadow
import React from 'react';

export default function Card({
  title,
  subtitle,
  icon,
  action,
  children,
  className = '',
  bodyClassName = ''
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/90 shadow-sm transition-shadow hover:shadow-md ${className}`}
    >
      {(title || subtitle || icon || action) && (
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5 min-w-0">
            {icon && (
              <div className="text-slate-600 flex-shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <h3 className="text-sm font-semibold text-slate-900 tracking-tight truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && <div className="flex items-center space-x-2 flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className={`p-4 sm:p-5 ${bodyClassName}`}>{children}</div>
    </div>
  );
}

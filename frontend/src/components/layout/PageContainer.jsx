// Purpose: Consistent page wrapper layout with responsive container padding
import React from 'react';

export default function PageContainer({
  titleBlock = null,
  action = null,
  children,
  maxWidth = 'max-w-7xl',
  className = ''
}) {
  return (
    <main className={`flex-1 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className={`${maxWidth} mx-auto space-y-6`}>
        {(titleBlock || action) && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {titleBlock}
            {action && <div className="flex items-center space-x-2">{action}</div>}
          </div>
        )}
        {children}
      </div>
    </main>
  );
}

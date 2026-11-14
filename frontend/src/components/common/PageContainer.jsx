import React from 'react';

/**
 * Standard PageContainer providing responsive padding, clean background,
 * and maximum width constraints according to Coastal Navy design tokens.
 */
export default function PageContainer({
  children,
  maxWidth = 'max-w-7xl',
  className = '',
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-900 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      <div className={`w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 flex-1 flex flex-col ${maxWidth} ${className}`}>
        {children}
      </div>
    </div>
  );
}


import React from 'react';
import Spinner from './Spinner';

/**
 * Accessible LoadingIndicator with message and optional fullscreen or inline display.
 */
export default function LoadingIndicator({
  message = 'Loading...',
  size = 'md',
  color = 'ocean',
  fullscreen = false,
  className = '',
}) {
  const content = (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex flex-col items-center justify-center gap-3 p-4 text-center ${className}`}
    >
      <Spinner size={size} color={color} />
      {message && (
        <p className="text-xs sm:text-sm font-sans font-medium text-slate-600 dark:text-slate-300 animate-pulse">
          {message}
        </p>
      )}
      <span className="sr-only">{message}</span>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-navy-900/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
}


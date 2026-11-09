import React from 'react';
import { cn } from '../../utils/cn';

export default function Spinner({ size = 'md', color = 'ocean', className }) {
  const sizes = {
    xs: 'w-3 h-3 border-2',
    sm: 'w-4 h-4 border-2',
    md: 'w-5 h-5 border-2',
    lg: 'w-8 h-8 border-3',
    xl: 'w-12 h-12 border-4',
  };

  const colors = {
    ocean: 'border-slate-200 border-t-ocean-600 dark:border-navy-700 dark:border-t-ocean-400',
    white: 'border-white/30 border-t-white',
    neutral: 'border-slate-300 border-t-slate-700 dark:border-navy-700 dark:border-t-slate-200',
  };

  return (
    <div
      className={cn(
        'rounded-full animate-spin shrink-0',
        sizes[size],
        colors[color] || colors.ocean,
        className
      )}
      role="status"
      aria-label="loading"
    />
  );
}

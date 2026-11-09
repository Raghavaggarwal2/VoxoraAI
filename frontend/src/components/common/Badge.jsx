import React from 'react';
import { cn } from '../../utils/cn';

export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className,
}) {
  const variants = {
    ocean: 'bg-ocean-50 text-ocean-700 border-ocean-200 dark:bg-navy-900 dark:text-ocean-300 dark:border-navy-700',
    blue: 'bg-ocean-50 text-ocean-700 border-ocean-200 dark:bg-navy-900 dark:text-ocean-300 dark:border-navy-700',
    groq: 'bg-ocean-50 text-ocean-700 border-ocean-200 dark:bg-navy-900 dark:text-ocean-300 dark:border-navy-700',
    mistral: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-navy-750 dark:text-slate-200 dark:border-navy-700',
    teal: 'bg-ocean-50 text-ocean-700 border-ocean-200 dark:bg-navy-900 dark:text-ocean-300 dark:border-navy-700',
    purple: 'bg-ocean-50 text-ocean-700 border-ocean-200 dark:bg-navy-900 dark:text-ocean-300 dark:border-navy-700',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50',
    danger: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-navy-800 dark:text-slate-300 dark:border-navy-700',
  };

  const dots = {
    ocean: 'bg-ocean-600 dark:bg-ocean-400',
    blue: 'bg-ocean-600 dark:bg-ocean-400',
    groq: 'bg-ocean-600 dark:bg-ocean-400',
    mistral: 'bg-slate-600 dark:bg-slate-300',
    teal: 'bg-ocean-600 dark:bg-ocean-400',
    purple: 'bg-ocean-600 dark:bg-ocean-400',
    success: 'bg-emerald-600 dark:bg-emerald-400',
    warning: 'bg-amber-600 dark:bg-amber-400',
    danger: 'bg-rose-600 dark:bg-rose-400',
    neutral: 'bg-slate-500 dark:text-slate-400',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-0.5 gap-1.5',
    lg: 'text-sm px-3 py-1 gap-2',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-sans font-medium rounded-full border text-xs',
        variants[variant] || variants.neutral,
        sizes[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', dots[variant] || dots.neutral)}
        />
      )}
      <span>{children}</span>
    </span>
  );
}

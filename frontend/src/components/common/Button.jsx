import React from 'react';
import { cn } from '../../utils/cn';
import Spinner from './Spinner';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className,
  leftIcon,
  rightIcon,
  type = 'button',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-sans font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-navy-900 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    primary:
      'bg-ocean-600 hover:bg-ocean-700 active:bg-ocean-800 text-white shadow-sm focus:ring-ocean-500',
    secondary:
      'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 dark:bg-navy-750 dark:hover:bg-navy-700 dark:active:bg-navy-600 dark:text-slate-100 border border-slate-200 dark:border-navy-700 focus:ring-ocean-500',
    outline:
      'border border-slate-300 dark:border-navy-700 bg-transparent hover:bg-slate-100 dark:hover:bg-navy-800 active:bg-slate-200 dark:active:bg-navy-750 text-slate-700 dark:text-slate-200 focus:ring-ocean-500',
    ghost:
      'bg-transparent hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white focus:ring-ocean-500',
    danger:
      'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 dark:text-rose-400 dark:border-rose-900/50 focus:ring-rose-500',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 rounded-md gap-1.5',
    md: 'text-sm px-4 py-2 rounded-lg gap-2',
    lg: 'text-base px-5 py-2.5 rounded-lg gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner size="sm" color={variant === 'primary' ? 'white' : 'ocean'} />
          <span>{children}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}

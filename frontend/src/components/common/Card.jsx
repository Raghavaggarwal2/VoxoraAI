import React from 'react';
import { cn } from '../../utils/cn';

export default function Card({
  children,
  className,
  hover = false,
  ...props
}) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl shadow-sm transition-colors duration-150',
        hover && 'hover:border-slate-300 dark:hover:border-navy-600',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

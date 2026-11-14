import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Reusable FeatureCard matching Coastal Navy design tokens.
 * Variants:
 * - 'pill': Compact badge with icon + label (Screen 1 Feature Highlights)
 * - 'action': Clickable selection card with icon, title, description (Screen 2 Workspace Select)
 * - 'detail': Informational card with icon badge, title, and body
 */
export default function FeatureCard({
  icon,
  title,
  description,
  variant = 'pill',
  active = false,
  onClick,
  className = '',
  badgeText,
  ...props
}) {
  if (variant === 'pill') {
    return (
      <div
        className={cn(
          'flex flex-col items-center text-center p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-850 transition-all duration-150 shadow-sm hover:border-ocean-400 dark:hover:border-navy-600 hover:shadow-md h-full',
          className
        )}
        {...props}
      >
        <div className="w-12 h-12 rounded-xl bg-ocean-50 dark:bg-navy-800 text-ocean-600 dark:text-ocean-400 flex items-center justify-center mb-3 shrink-0 border border-ocean-100/50 dark:border-navy-700">
          {icon}
        </div>
        <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-sans mb-1.5">
          {title}
        </span>
        {description && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
            {description}
          </p>
        )}
      </div>
    );
  }

  if (variant === 'action') {
    const isClickable = Boolean(onClick);
    const Component = isClickable ? 'button' : 'div';

    return (
      <Component
        type={isClickable ? 'button' : undefined}
        onClick={onClick}
        className={cn(
          'w-full text-left p-6 sm:p-8 rounded-2xl border-2 transition-all duration-150 flex flex-col items-center text-center group cursor-pointer focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:ring-offset-2 dark:focus:ring-offset-navy-900',
          active
            ? 'border-ocean-600 bg-ocean-50/40 dark:bg-navy-800/80 shadow-md'
            : 'border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-850 hover:border-ocean-400 dark:hover:border-navy-600 shadow-sm hover:shadow',
          className
        )}
        {...props}
      >
        {badgeText && (
          <span className="self-end -mt-2 -mr-2 mb-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-ocean-100 dark:bg-ocean-950 text-ocean-700 dark:text-ocean-300 border border-ocean-200 dark:border-ocean-800">
            {badgeText}
          </span>
        )}
        <div className="w-14 h-14 rounded-2xl bg-ocean-50 dark:bg-navy-800 text-ocean-600 dark:text-ocean-400 flex items-center justify-center mb-4 transition-transform duration-150 group-hover:scale-105 shrink-0 border border-ocean-100 dark:border-navy-700">
          {icon}
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white font-sans mb-1.5">
          {title}
        </h3>
        {description && (
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs">
            {description}
          </p>
        )}
      </Component>
    );
  }

  // Default 'detail' card
  return (
    <div
      className={cn(
        'p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-850 shadow-sm',
        className
      )}
      {...props}
    >
      <div className="w-10 h-10 rounded-lg bg-ocean-50 dark:bg-navy-800 text-ocean-600 dark:text-ocean-400 flex items-center justify-center mb-3">
        {icon}
      </div>
      <h4 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white mb-1">
        {title}
      </h4>
      {description && (
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}


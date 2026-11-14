import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Accessible password input component with show/hide visibility toggle.
 */
export default function PasswordInput({
  label,
  error,
  leftIcon = <Lock className="w-4 h-4" />,
  className,
  id,
  helperText,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-sans"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none shrink-0 flex items-center justify-center">
            {leftIcon}
          </span>
        )}

        <input
          id={inputId}
          type={showPassword ? 'text' : 'password'}
          className={cn(
            'w-full bg-white dark:bg-navy-900 border border-slate-300 dark:border-navy-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm px-3.5 py-2.5 transition-colors duration-150 outline-none',
            'focus:border-ocean-600 focus:ring-2 focus:ring-ocean-500/20 dark:focus:border-ocean-500 dark:focus:ring-ocean-400/20',
            leftIcon && 'pl-9',
            'pr-10',
            error && 'border-rose-500 dark:border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
            className
          )}
          {...props}
        />

        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          tabIndex={-1}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="absolute right-3 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-1"
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>

      {error ? (
        <p className="text-xs text-rose-600 dark:text-rose-400 font-sans mt-1">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-1">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}


import React from 'react';

/**
 * Reusable FormField container ensuring consistent spacing, labels,
 * helper text, and validation error messages across all forms.
 */
export default function FormField({
  label,
  id,
  required = false,
  error,
  helperText,
  children,
  className = '',
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-sans"
        >
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}

      {children}

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


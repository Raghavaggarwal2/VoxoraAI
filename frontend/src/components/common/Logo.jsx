import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Voxora AI Logo matching the visual reference image.
 * Features the signature geometric four-node star emblem in Ocean Blue.
 */
export default function Logo({
  size = 'md',
  showText = true,
  to = '/',
  className = '',
  subtitle,
  inverted = false,
}) {
  const sizeClasses = {
    sm: {
      icon: 'w-6 h-6',
      svg: 16,
      text: 'text-base',
      sub: 'text-[9px]',
    },
    md: {
      icon: 'w-8.5 h-8.5 sm:w-9 sm:h-9',
      svg: 22,
      text: 'text-xl sm:text-2xl',
      sub: 'text-[10px]',
    },
    lg: {
      icon: 'w-9 h-9 sm:w-10 sm:h-10',
      svg: 24,
      text: 'text-xl sm:text-2xl',
      sub: 'text-[11px]',
    },
    xl: {
      icon: 'w-11 h-11 sm:w-12 sm:h-12',
      svg: 30,
      text: 'text-2xl sm:text-3xl',
      sub: 'text-xs',
    },
  }[size] || {
    icon: 'w-8 h-8',
    svg: 20,
    text: 'text-xl',
    sub: 'text-[10px]',
  };

  const content = (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* ── Brand Emblem ── */}
      <img
        src="/favicon.png"
        alt="Voxora AI"
        className={`${sizeClasses.icon} object-contain rounded-lg shrink-0`}
      />

      {/* ── Brand Typography ── */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-display font-bold tracking-tight ${
                inverted ? 'text-white' : 'text-slate-900 dark:text-white'
              } ${sizeClasses.text}`}
            >
              Voxora
            </span>
            <span
              className={
                inverted
                  ? 'font-display font-bold text-ocean-400'
                  : 'font-display font-bold text-ocean-600 dark:text-ocean-400'
              }
            >
              AI
            </span>
          </div>
          {subtitle && (
            <span
              className={`text-slate-500 dark:text-slate-400 font-mono tracking-wider uppercase mt-0.5 ${sizeClasses.sub}`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="inline-block hover:opacity-95 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}


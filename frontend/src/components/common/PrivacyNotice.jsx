import React from 'react';
import { ShieldCheck, HardDrive, UserX, Lock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * PrivacyNotice component communicating local-first and privacy guarantees.
 * Variants:
 * - 'strip': Horizontal 3-pill banner used on Landing Page
 * - 'checklist': Vertical trust checklist with check icons used on Create Workspace
 * - 'warning': Alert callout warning about recovery key and password responsibility
 */
export default function PrivacyNotice({
  variant = 'strip',
  className = '',
  items,
}) {
  if (variant === 'strip') {
    const defaultPills = [
      { icon: <ShieldCheck className="w-5 h-5 text-ocean-600 dark:text-ocean-400 shrink-0" />, label: 'Privacy-First Architecture' },
      { icon: <HardDrive className="w-5 h-5 text-ocean-600 dark:text-ocean-400 shrink-0" />, label: 'Encrypted IndexedDB & Local OPFS' },
      { icon: <Lock className="w-5 h-5 text-ocean-600 dark:text-ocean-400 shrink-0" />, label: 'Client AES-256-GCM Encryption' },
      { icon: <UserX className="w-5 h-5 text-ocean-600 dark:text-ocean-400 shrink-0" />, label: 'Zero Cloud Accounts & Self-Custody' },
    ];
    const pills = items || defaultPills;

    return (
      <div
        className={cn(
          'w-full flex flex-wrap items-center justify-center gap-4 sm:gap-8 py-4 px-6 rounded-2xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-850 shadow-sm text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300',
          className
        )}
      >
        {pills.map((p, idx) => (
          <div key={idx} className="inline-flex items-center gap-2.5">
            {p.icon}
            <span>{p.label}</span>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'checklist') {
    const defaultChecklist = [
      'Your data stays on your device',
      'Encrypted with your password',
      'No account or email required',
    ];
    const list = items || defaultChecklist;

    return (
      <div className={cn('space-y-3.5', className)}>
        {list.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200 font-sans">
            <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <span>{item}</span>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'warning') {
    return (
      <div
        className={cn(
          'p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 text-xs sm:text-sm leading-relaxed flex items-start gap-3',
          className
        )}
      >
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-950 dark:text-amber-100">
            Important Security Notice
          </p>
          <p className="text-amber-800 dark:text-amber-300">
            Your workspace is encrypted locally. Forgetting both your password and your recovery key will result in permanent, unrecoverable data loss.
          </p>
        </div>
      </div>
    );
  }

  return null;
}


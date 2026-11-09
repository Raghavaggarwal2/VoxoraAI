import React, { useState } from 'react';
import { Copy, Check, CheckCircle2, ShieldCheck } from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';

export default function DecisionsPanel({ decisionsText }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(decisionsText || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const lines = (decisionsText || '')
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((line) => line.replace(/^[-*•\d+.]\s*/, ''));

  return (
    <div className="space-y-4">
      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-navy-700">
        <div className="flex items-center gap-2">
          <Badge variant="ocean" size="sm">
            {lines.length} Decisions Logged
          </Badge>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-sans">
            Explicit agreements and strategic consensus
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        >
          {copied ? 'Copied' : 'Copy Decisions'}
        </Button>
      </div>

      {/* ── Decisions List ──────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-850 p-4 space-y-2.5 shadow-sm">
        {lines.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
            No formal decisions identified in this discussion.
          </div>
        ) : (
          lines.map((dec, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900"
            >
              <div className="w-6 h-6 rounded-md bg-ocean-50 dark:bg-navy-800 border border-ocean-200 dark:border-navy-700 text-ocean-600 dark:text-ocean-400 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-sans leading-relaxed">
                {dec}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


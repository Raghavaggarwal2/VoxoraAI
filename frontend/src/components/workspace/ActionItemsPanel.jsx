import React, { useState } from 'react';
import { Copy, Check, CheckSquare, Square, CheckCircle2 } from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';

export default function ActionItemsPanel({ actionItemsText }) {
  const [copied, setCopied] = useState(false);
  const [completedItems, setCompletedItems] = useState({});

  const handleCopy = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(actionItemsText || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Parse lines into items
  const lines = (actionItemsText || '')
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((line) => line.replace(/^[-*•\d+.]\s*/, ''));

  const toggleCheck = (idx) => {
    setCompletedItems((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const completedCount = Object.values(completedItems).filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-navy-700">
        <div className="flex items-center gap-2">
          <Badge variant="ocean" size="sm">
            {lines.length} Action Items
          </Badge>
          {lines.length > 0 && (
            <span className="text-xs text-slate-500 dark:text-slate-400 font-sans">
              {completedCount} of {lines.length} done
            </span>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        >
          {copied ? 'Copied' : 'Copy All Tasks'}
        </Button>
      </div>

      {/* ── Action Items List ───────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-850 p-4 space-y-2.5 shadow-sm">
        {lines.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
            No actionable tasks identified in this media.
          </div>
        ) : (
          lines.map((task, idx) => {
            const isDone = Boolean(completedItems[idx]);

            return (
              <div
                key={idx}
                onClick={() => toggleCheck(idx)}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer select-none ${
                  isDone
                    ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-navy-700 hover:border-slate-300 dark:hover:border-navy-600 bg-white dark:bg-navy-900'
                }`}
              >
                <button
                  type="button"
                  className="mt-0.5 text-slate-400 dark:text-slate-500 hover:text-ocean-600 dark:hover:text-ocean-400 shrink-0"
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
                <span
                  className={`text-xs sm:text-sm font-sans leading-relaxed ${
                    isDone
                      ? 'line-through text-slate-400 dark:text-slate-500'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {task}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


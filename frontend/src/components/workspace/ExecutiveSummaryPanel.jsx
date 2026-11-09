import React, { useState } from 'react';
import { Copy, Check, FileText, Sparkles } from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';

export default function ExecutiveSummaryPanel({ summaryText, wordCount }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(summaryText || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const paragraphs = (summaryText || '')
    .split(/\n\n+/)
    .filter((p) => p.trim().length > 0);

  return (
    <div className="space-y-4">
      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-navy-700">
        <div className="flex items-center gap-2">
          <Badge variant="ocean" size="sm">
            Executive Brief
          </Badge>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-sans">
            Synthesized via Mistral AI
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        >
          {copied ? 'Copied' : 'Copy Summary'}
        </Button>
      </div>

      {/* ── Summary Content ─────────────────────────────────────────────────── */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-850 shadow-sm space-y-4">
        {!summaryText || summaryText.trim().length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
            No summary content available.
          </div>
        ) : (
          paragraphs.map((p, i) => (
            <p
              key={i}
              className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans"
            >
              {p}
            </p>
          ))
        )}
      </div>
    </div>
  );
}


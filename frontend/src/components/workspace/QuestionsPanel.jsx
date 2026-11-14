import React, { useState } from 'react';
import { Copy, Check, HelpCircle } from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { renderInlineMarkdown } from '../common/MarkdownRenderer';
import { parseListItems } from '../../utils/textParser';

export default function QuestionsPanel({ questionsText }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(questionsText || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const lines = parseListItems(questionsText);

  return (
    <div className="space-y-4">
      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-navy-700">
        <div className="flex items-center gap-2">
          <Badge variant={lines.length > 0 ? 'ocean' : 'neutral'} size="sm">
            {lines.length} {lines.length === 1 ? 'Open Question' : 'Open Questions'}
          </Badge>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-sans">
            Unresolved points and items requiring follow-up
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        >
          {copied ? 'Copied' : 'Copy Questions'}
        </Button>
      </div>

      {/* ── Questions List ──────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-850 p-4 space-y-2.5 shadow-sm">
        {lines.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
            No unresolved open questions recorded in this session.
          </div>
        ) : (
          lines.map((q, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900"
            >
              <div className="w-6 h-6 rounded-md bg-amber-50 dark:bg-navy-800 border border-amber-200 dark:border-navy-700 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <HelpCircle className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-sans leading-relaxed">
                {renderInlineMarkdown(q)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


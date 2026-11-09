import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  Search,
  FileText,
  AlignLeft,
} from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { api } from '../../services/api';

export default function TranscriptPanel({ jobId, transcriptText, wordCount, sourceAttribution }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(transcriptText || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadUrl = api.downloadTranscriptUrl(jobId);

  // Filter or highlight text segments
  const paragraphs = (transcriptText || '')
    .split(/\n\n+/)
    .filter((p) => p.trim().length > 0);

  const filteredParagraphs = searchTerm.trim()
    ? paragraphs.filter((p) => p.toLowerCase().includes(searchTerm.toLowerCase()))
    : paragraphs;

  return (
    <div className="space-y-4">
      {/* ── Toolbar & Metadata ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-navy-700">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="ocean" size="sm">
            {wordCount || (transcriptText ? transcriptText.split(/\s+/).length : 0)} Words
          </Badge>
          {sourceAttribution && (
            <Badge variant="neutral" size="sm">
              {sourceAttribution}
            </Badge>
          )}
          <span className="text-xs text-slate-500 dark:text-slate-400 font-sans">
            Normalized 16kHz audio transcript
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {copied ? 'Copied' : 'Copy Full Transcript'}
          </Button>

          <a href={downloadUrl} download>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Download (.txt)
            </Button>
          </a>
        </div>
      </div>

      {/* ── Search Bar ──────────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter keywords in transcript..."
          className="w-full bg-white dark:bg-navy-900 border border-slate-300 dark:border-navy-700 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-ocean-600 focus:ring-1 focus:ring-ocean-500 transition-colors"
        />
        {searchTerm && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-mono">
            {filteredParagraphs.length} matching segment(s)
          </span>
        )}
      </div>

      {/* ── Transcript Text Container ───────────────────────────────────────── */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 shadow-sm max-h-[560px] overflow-y-auto space-y-4">
        {!transcriptText || transcriptText.trim().length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
            No transcript content available for this job.
          </div>
        ) : filteredParagraphs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
            No segments match "{searchTerm}".
          </div>
        ) : (
          filteredParagraphs.map((para, idx) => (
            <p
              key={idx}
              className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans"
            >
              {para}
            </p>
          ))
        )}
      </div>
    </div>
  );
}


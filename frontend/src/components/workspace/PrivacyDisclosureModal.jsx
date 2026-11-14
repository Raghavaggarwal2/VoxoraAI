import React, { useState } from 'react';
import { ShieldCheck, Cloud, HardDrive, Lock, AlertCircle, X, ArrowRight } from 'lucide-react';
import Button from '../common/Button';

/**
 * Privacy Disclosure Modal
 * Required before transmitting media or audio to the backend AI services.
 * Informs user of local storage vs. cloud processing via Groq API.
 */
export default function PrivacyDisclosureModal({ isOpen, onClose, onConfirm, isProcessing = false }) {
  const [agreed, setAgreed] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-none animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-disclosure-title"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-navy-850 rounded-2xl border border-slate-200 dark:border-navy-750 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100 dark:border-navy-750 bg-slate-50 dark:bg-navy-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ocean-100 dark:bg-navy-800 text-ocean-600 dark:text-ocean-400 flex items-center justify-center shrink-0 border border-ocean-200 dark:border-navy-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="privacy-disclosure-title"
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-sans"
              >
                AI Processing &amp; Privacy Notice
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Local-first storage with secure cloud AI inference
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          <p className="leading-relaxed">
            Voxora AI is built on a <strong>local-first architecture</strong>. Before starting this analysis, please review how your media and data are handled:
          </p>

          <div className="space-y-3">
            {/* Point 1: Local OPFS Storage */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200/80 dark:border-navy-750">
              <HardDrive className="w-4 h-4 text-ocean-600 dark:text-ocean-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-900 dark:text-white block">
                  Media Stored on Your Device
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-xs leading-normal">
                  Original media files are kept locally in your browser's private file storage (OPFS) and never stored on cloud servers.
                </span>
              </div>
            </div>

            {/* Point 2: Groq Cloud API for Transcription & LLM */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200/80 dark:border-navy-750">
              <Cloud className="w-4 h-4 text-ocean-600 dark:text-ocean-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-900 dark:text-white block">
                  Ephemeral Groq Cloud Inference
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-xs leading-normal">
                  Audio is streamed securely to the Voxora FastAPI backend to transcribe via Groq Whisper and extract structured intelligence using Groq GPT-OSS-20B.
                </span>
              </div>
            </div>

            {/* Point 3: Encrypted At Rest */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200/80 dark:border-navy-750">
              <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-900 dark:text-white block">
                  Local Envelope Encryption
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-xs leading-normal">
                  All generated transcripts, executive summaries, mind maps, and conversational messages are encrypted locally using AES-256-GCM before saving to your device.
                </span>
              </div>
            </div>
          </div>

          {/* User Confirmation Checkbox */}
          <label className="flex items-start gap-3 p-3 rounded-xl bg-ocean-50/60 dark:bg-navy-800/60 border border-ocean-200 dark:border-navy-700 cursor-pointer select-none">
            <input
              type="checkbox"
              id="privacy-disclosure-agreement"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              disabled={isProcessing}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-ocean-600 focus:ring-ocean-500 cursor-pointer"
            />
            <span className="text-xs text-slate-700 dark:text-slate-200 font-medium">
              I understand that audio will be transmitted securely to Voxora AI services for transcription and intelligence extraction.
            </span>
          </label>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-4 px-6 border-t border-slate-100 dark:border-navy-750 bg-slate-50 dark:bg-navy-900">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => {
              if (agreed && onConfirm) {
                onConfirm();
              }
            }}
            disabled={!agreed || isProcessing}
            isLoading={isProcessing}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Authorize &amp; Start Analysis
          </Button>
        </div>
      </div>
    </div>
  );
}


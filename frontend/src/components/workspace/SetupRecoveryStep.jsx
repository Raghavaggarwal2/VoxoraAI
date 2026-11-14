import React, { useState } from 'react';
import { Copy, Check, Download, ShieldAlert, KeyRound, ArrowRight } from 'lucide-react';
import Button from '../common/Button';

/**
 * Step 2 of Workspace Creation: 24-word BIP-39 Recovery Phrase Display & Safeguard.
 * Requires explicit user confirmation that the key has been saved before proceeding.
 */
export default function SetupRecoveryStep({
  recoveryKey,
  workspaceName,
  onComplete,
}) {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const words = recoveryKey ? recoveryKey.trim().split(/\s+/) : [];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(recoveryKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleDownload = () => {
    const textContent = [
      '==================================================================',
      `VOXORA AI — ENCRYPTED WORKSPACE RECOVERY PHRASE`,
      `Workspace Name : ${workspaceName}`,
      `Created At     : ${new Date().toUTCString()}`,
      '==================================================================',
      '',
      'CRITICAL SECURITY WARNING:',
      'Keep this 24-word phrase strictly private and offline. If you ever',
      'forget your workspace password, this phrase is the ONLY cryptographic',
      'key that can unwrap and restore your local database.',
      '',
      'RECOVERY PHRASE (24 WORDS):',
      '------------------------------------------------------------------',
      recoveryKey,
      '------------------------------------------------------------------',
      '',
      'Do not upload, email, or share this phrase with anyone.',
    ].join('\n');

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `voxora-recovery-${workspaceName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="space-y-1.5 text-center">
        <div className="w-12 h-12 rounded-2xl bg-ocean-50 dark:bg-navy-800 text-ocean-600 dark:text-ocean-400 border border-ocean-100 dark:border-navy-700 flex items-center justify-center mx-auto mb-2">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-display">
          Save Your Recovery Phrase
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Write down or save these 24 words in exact order. If you forget your password, this phrase is the <strong>only</strong> way to restore your workspace.
        </p>
      </div>

      {/* 24-Word Grid */}
      <div className="bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-xl p-4 sm:p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {words.map((word, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-white dark:bg-navy-850 px-2.5 py-1.5 rounded-lg border border-slate-200/80 dark:border-navy-750 text-xs font-mono select-all"
            >
              <span className="text-slate-400 dark:text-slate-500 w-5 text-right font-sans select-none">
                {index + 1}.
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {word}
              </span>
            </div>
          ))}
        </div>

        {/* Action bar for Copy & Download */}
        <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-navy-750 flex flex-wrap items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            leftIcon={copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          >
            {copied ? 'Copied to Clipboard' : 'Copy All Words'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Download .txt File
          </Button>
        </div>
      </div>

      {/* Security notice banner */}
      <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Voxora AI is zero-knowledge and local-first. We do not store this phrase on any server and cannot recover your data if you lose it.
        </p>
      </div>

      {/* Confirmation Checkbox */}
      <div className="pt-1">
        <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-850 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded border-slate-300 dark:border-navy-700 text-ocean-600 focus:ring-ocean-500 shrink-0"
          />
          <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
            I have securely written down or downloaded my 24-word recovery phrase and understand that it cannot be retrieved if lost.
          </span>
        </label>
      </div>

      {/* Submit button */}
      <div>
        <Button
          variant="primary"
          size="lg"
          disabled={!confirmed}
          onClick={onComplete}
          className="w-full text-base"
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Confirm &amp; Enter Workspace
        </Button>
      </div>
    </div>
  );
}


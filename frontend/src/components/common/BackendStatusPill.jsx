import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { RefreshCw } from 'lucide-react';

export default function BackendStatusPill() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const data = await api.checkHealth();
      setHealth(data);
    } catch {
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const isOnline = Boolean(health?.status === 'ok');
  const whisperReady = Boolean(health?.providers?.groq_whisper?.configured ?? health?.providers?.groq?.configured);
  const llmReady = Boolean(health?.providers?.groq_llm?.configured ?? health?.providers?.groq?.configured);
  const isDual = Boolean(health?.providers?.groq?.dual_account);

  return (
    <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs shadow-sm">
      {loading ? (
        <RefreshCw className="w-3 h-3 animate-spin text-ocean-600 dark:text-ocean-400" />
      ) : isOnline ? (
        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
      ) : (
        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
      )}

      <span className="font-sans text-xs text-slate-600 dark:text-slate-300">
        {loading ? 'Checking...' : isOnline ? 'API Connected' : 'API Offline'}
      </span>

      {isOnline && (
        <div className="hidden sm:flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-navy-700 text-[11px]">
          <span
            className={`px-1.5 py-0.2 rounded font-mono ${
              whisperReady
                ? 'bg-slate-100 text-slate-700 dark:bg-navy-900 dark:text-slate-300'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
            }`}
            title="Groq Whisper Speech Transcription (Account 1)"
          >
            Whisper
          </span>
          <span
            className={`px-1.5 py-0.2 rounded font-mono ${
              llmReady
                ? 'bg-slate-100 text-slate-700 dark:bg-navy-900 dark:text-slate-300'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
            }`}
            title="Groq GPT-OSS 20B Intelligence (Account 2)"
          >
            GPT-OSS 20B
          </span>
          {isDual && (
            <span
              className="px-1.5 py-0.2 rounded font-mono bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 text-[10px]"
              title="Dual Groq Accounts active (Whisper + LLM isolation)"
            >
              Dual Acct
            </span>
          )}
        </div>
      )}
    </div>
  );
}

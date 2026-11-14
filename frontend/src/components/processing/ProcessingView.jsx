import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  Cpu,
  Layers,
  Network,
  Database,
} from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Spinner from '../common/Spinner';
import { api } from '../../services/api';

const PIPELINE_STAGES = [
  {
    id: 'preparing_audio',
    title: 'Audio Preparation',
    description: 'Resampling media to 16kHz mono WAV and segmenting audio chunks',
    icon: Layers,
  },
  {
    id: 'transcribing',
    title: 'Whisper Transcription',
    description: 'Ultra-fast speech-to-text via Groq Cloud whisper-large-v3',
    icon: Cpu,
  },
  {
    id: 'analyzing',
    title: 'Executive Intelligence',
    description: 'Generating summaries, action items, key decisions, and topic maps',
    icon: Network,
  },
  {
    id: 'indexing',
    title: 'Vector Indexing',
    description: 'Storing semantic chunks in session-isolated ChromaDB collection',
    icon: Database,
  },
];

const STAGE_ORDER = [
  'queued',
  'preparing_audio',
  'transcribing',
  'analyzing',
  'indexing',
  'completed',
];

export default function ProcessingView({ jobId, onComplete, onStatusUpdate }) {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(null);
  const [isJobNotFound, setIsJobNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const pollTimerRef = useRef(null);
  const consecutiveErrorsRef = useRef(0);
  const consecutive404Ref = useRef(0);

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const fetchStatus = async () => {
    // Guard against empty, undefined, or temporary local analysis IDs
    if (!jobId || jobId === 'undefined' || jobId === 'null' || jobId.startsWith('analysis_')) {
      return;
    }

    try {
      const data = await api.getJobStatus(jobId);
      consecutiveErrorsRef.current = 0;
      consecutive404Ref.current = 0;
      setJob(data);
      setNetworkError(null);
      setIsJobNotFound(false);
      setLoading(false);

      if (onStatusUpdate) {
        onStatusUpdate(data);
      }

      if (data.status === 'completed' || data.status === 'failed') {
        stopPolling();
        if (onComplete) {
          onComplete(data);
        }
      }
    } catch (err) {
      setLoading(false);

      // Handle 404 with a 3-try grace window for newly queued backend jobs
      if (err.status === 404 || err.code === 'JOB_NOT_FOUND' || err.code === 'HTTP_404') {
        consecutive404Ref.current += 1;
        if (consecutive404Ref.current >= 3) {
          stopPolling();
          if (!job) {
            setIsJobNotFound(true);
            setNetworkError('Processing job was not found on the backend server. The active session has expired.');
          }
        }
        return;
      }

      consecutiveErrorsRef.current += 1;
      // Stop polling after 5 consecutive network errors to prevent infinite requests
      if (consecutiveErrorsRef.current >= 5) {
        stopPolling();
        setNetworkError(
          'Unable to reach the processing server after multiple attempts. Polling has been paused.'
        );
        return;
      }

      setNetworkError(err.message || 'Unable to communicate with the processing server.');
    }
  };

  useEffect(() => {
    consecutiveErrorsRef.current = 0;
    consecutive404Ref.current = 0;
    fetchStatus();

    // Poll every 1.0 second while active for immediate real-time progress updates
    pollTimerRef.current = setInterval(() => {
      fetchStatus();
    }, 1000);

    return () => {
      stopPolling();
    };
  }, [jobId]);

  // Stop polling once terminal state is reached
  useEffect(() => {
    if (job?.status === 'completed' || job?.status === 'failed') {
      stopPolling();
    }
  }, [job?.status]);

  const handleCopyJobId = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(jobId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Determine stage status: 'completed' | 'current' | 'pending' | 'failed'
  const getStageStatus = (stageId) => {
    if (!job) return 'pending';
    if (job.status === 'completed') return 'completed';

    const currentStageIdx = STAGE_ORDER.indexOf(job.stage);
    const thisStageIdx = STAGE_ORDER.indexOf(stageId);

    if (job.status === 'failed') {
      if (thisStageIdx === currentStageIdx) return 'failed';
      if (thisStageIdx < currentStageIdx) return 'completed';
      return 'pending';
    }

    if (thisStageIdx < currentStageIdx) return 'completed';
    if (thisStageIdx === currentStageIdx) return 'current';
    return 'pending';
  };

  const getStatusBadge = () => {
    if (!job) return null;
    switch (job.status) {
      case 'completed':
        return <Badge variant="success" dot>Completed</Badge>;
      case 'failed':
        return <Badge variant="danger" dot>Failed</Badge>;
      case 'processing':
        return <Badge variant="ocean" dot>In Progress</Badge>;
      case 'queued':
      default:
        return <Badge variant="neutral" dot>Queued</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-navy-700">
        <div className="space-y-1">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors font-sans mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>New Analysis</span>
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-white">
              Processing Media Analysis
            </h1>
            {getStatusBadge()}
          </div>
        </div>

        {/* Job ID Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-300 shadow-sm">
            <span>Job:</span>
            <span className="font-semibold">{jobId.slice(0, 8)}...</span>
            <button
              type="button"
              onClick={handleCopyJobId}
              className="p-1 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors"
              title="Copy Job ID"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Network Error Banner ────────────────────────────────────────────── */}
      {networkError && !isJobNotFound && (
        <div className="flex items-start justify-between gap-3 p-3.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800/60 dark:text-amber-200 text-xs">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <span>{networkError}</span>
          </div>
          <button
            type="button"
            onClick={fetchStatus}
            className="inline-flex items-center gap-1 font-semibold underline hover:no-underline shrink-0"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* ── Job Not Found Recovery Card ─────────────────────────────────────── */}
      {isJobNotFound && !job && (
        <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50/80 dark:bg-rose-950/40 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-200 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="font-semibold text-sm">Processing session expired or not found</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            The job with ID <code className="font-mono px-1 py-0.5 rounded bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700">{jobId}</code> is no longer active on the server (the server may have restarted).
          </p>
          <div className="pt-1 flex items-center gap-2">
            <Link
              to="/history"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-navy-800 border border-slate-300 dark:border-navy-750 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to History</span>
            </Link>
          </div>
        </div>
      )}

      {/* ── Main Progress Card ──────────────────────────────────────────────── */}
      <Card className="p-6 space-y-6">
        {loading && !job ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-3">
            <Spinner size="lg" color="ocean" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
              Connecting to job status stream...
            </p>
          </div>
        ) : (
          <>
            {/* Live Status Message & Percentage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-sans">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {job?.status_message || 'Initializing pipeline...'}
                </span>
                <span className="font-mono font-bold text-ocean-700 dark:text-ocean-300 text-sm">
                  {job?.progress_percent ?? 0}%
                </span>
              </div>

              {/* Progress Bar (Pure Solid Fill, No Gradients) */}
              <div className="w-full bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-ocean-600 dark:bg-ocean-500 h-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(100, Math.max(0, job?.progress_percent ?? 0))}%` }}
                />
              </div>
            </div>

            {/* Failure Box */}
            {job?.status === 'failed' && (
              <div className="p-4 rounded-lg border text-xs space-y-2.5 border-rose-200 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-900/60 text-rose-800 dark:text-rose-200">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>Processing Failed</span>
                </div>
                <p className="leading-relaxed">
                  {job?.error?.message ||
                    job?.status_message ||
                    'An error occurred during audio/video processing.'}
                </p>
                {job?.error?.code === 'NO_AUDIO_STREAM' && (
                  <div className="p-2.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-[11px] leading-relaxed">
                    <strong>Tip:</strong> If you downloaded this video with a web downloader or browser tool, it may have saved only the video stream (silent DASH track). Please ensure you download the complete file with audio or upload a media file with spoken sound.
                  </div>
                )}
                {job?.error?.code && (
                  <p className="font-mono text-[11px] opacity-80">
                    Error Code: {job.error.code}
                  </p>
                )}
                <div className="pt-1 flex items-center gap-2">
                  <Link to="/">
                    <Button variant="danger" size="sm">
                      Try Another Analysis
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Completed Box */}
            {job?.status === 'completed' && (
              <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>All processing stages completed successfully.</span>
                </div>
                {onComplete && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onComplete(job)}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    View Results
                  </Button>
                )}
              </div>
            )}

            {/* Stepper Pipeline List */}
            <div className="space-y-3 pt-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-sans">
                Pipeline Stages
              </h2>

              <div className="space-y-2">
                {PIPELINE_STAGES.map((stage) => {
                  const stageState = getStageStatus(stage.id);
                  const Icon = stage.icon;

                  let indicator;
                  let cardBorder = 'border-slate-200 dark:border-navy-700';
                  let bgSurface = 'bg-white dark:bg-navy-850';

                  if (stageState === 'completed') {
                    indicator = <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
                    bgSurface = 'bg-slate-50/60 dark:bg-navy-900/40';
                  } else if (stageState === 'current') {
                    indicator = <Spinner size="sm" color="ocean" className="shrink-0" />;
                    cardBorder = 'border-ocean-500 dark:border-ocean-500 ring-1 ring-ocean-500/20';
                    bgSurface = 'bg-ocean-50/30 dark:bg-navy-800';
                  } else if (stageState === 'failed') {
                    indicator = <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />;
                    cardBorder = 'border-rose-400 dark:border-rose-500';
                    bgSurface = 'bg-rose-50/30 dark:bg-rose-950/20';
                  } else {
                    indicator = <Clock className="w-4 h-4 text-slate-400 dark:text-slate-600 shrink-0" />;
                    bgSurface = 'bg-white dark:bg-navy-900';
                  }

                  return (
                    <div
                      key={stage.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${cardBorder} ${bgSurface} transition-colors`}
                    >
                      <div className="mt-0.5">{indicator}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-semibold ${
                              stageState === 'current'
                                ? 'text-ocean-700 dark:text-ocean-300'
                                : stageState === 'completed'
                                ? 'text-slate-800 dark:text-slate-200'
                                : stageState === 'failed'
                                ? 'text-rose-700 dark:text-rose-300'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {stage.title}
                          </span>
                          {stageState === 'current' && (
                            <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-ocean-100 text-ocean-800 dark:bg-navy-950 dark:text-ocean-300">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                          {stage.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}


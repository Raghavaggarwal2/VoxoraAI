import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  FileText,
  CheckSquare,
  Key,
  HelpCircle,
  Network,
  MessageSquare,
  AlignLeft,
  ArrowLeft,
  Download,
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Play,
  Sparkles,
  Lock,
  Video,
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import ProcessingView from '../components/processing/ProcessingView';
import PrivacyDisclosureModal from '../components/workspace/PrivacyDisclosureModal';

// Workspace Panels
import ExecutiveSummaryPanel from '../components/workspace/ExecutiveSummaryPanel';
import ActionItemsPanel from '../components/workspace/ActionItemsPanel';
import DecisionsPanel from '../components/workspace/DecisionsPanel';
import QuestionsPanel from '../components/workspace/QuestionsPanel';
import ChatPanel from '../components/workspace/ChatPanel';
import TranscriptPanel from '../components/workspace/TranscriptPanel';

const MermaidViewer = React.lazy(() => import('../components/workspace/MermaidViewer'));

import { api } from '../services/api';
import { useWorkspace } from '../context/WorkspaceContext';
import { dataRepository } from '../database/data.repository';
import { storageService } from '../database/storage.service';
import { parseListItems } from '../utils/textParser';

const TABS = [
  { id: 'summary', label: 'Executive Summary', icon: FileText },
  { id: 'actions', label: 'Action Items', icon: CheckSquare },
  { id: 'decisions', label: 'Decisions', icon: Key },
  { id: 'questions', label: 'Open Questions', icon: HelpCircle },
  { id: 'mindmap', label: 'Mind Map', icon: Network },
  { id: 'chat', label: 'AI Chat', icon: MessageSquare },
  { id: 'transcript', label: 'Transcript', icon: AlignLeft },
];

export default function WorkspacePage() {
  const { jobId } = useParams();
  const location = useLocation();
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.id;

  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState('summary');
  const [showPipelineLog, setShowPipelineLog] = useState(false);

  // Local Analysis Metadata (if found in Dexie)
  const [localAnalysis, setLocalAnalysis] = useState(null);
  const initialBackendJobId = location.state?.backendJobId || null;
  const [backendJobId, setBackendJobId] = useState(initialBackendJobId);

  // Media Player state (OPFS)
  const [mediaBlobUrl, setMediaBlobUrl] = useState(null);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [isPlayerCollapsed, setIsPlayerCollapsed] = useState(false);

  // Status & Data States
  const [jobStatus, setJobStatus] = useState(null);
  const [results, setResults] = useState(null);
  const [transcriptData, setTranscriptData] = useState(null);

  // Loading & Error States
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [resultsError, setResultsError] = useState(null);

  // Ready State Trigger / Privacy Modal
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [isStartingAnalysis, setIsStartingAnalysis] = useState(false);

  // ── Load OPFS Media Blob for In-Browser Playback ───────────────────────────
  useEffect(() => {
    let isCancelled = false;
    let createdUrl = null;

    async function loadMediaBlob() {
      if (!workspaceId || !localAnalysis?.mediaFileId) {
        setMediaBlobUrl(null);
        return;
      }

      setMediaLoading(true);
      try {
        if (storageService.isAvailable()) {
          const blob = await storageService.getMedia(workspaceId, localAnalysis.mediaFileId);
          if (blob && !isCancelled) {
            createdUrl = URL.createObjectURL(blob);
            setMediaBlobUrl(createdUrl);
          }
        }
      } catch (err) {
        console.warn('Could not load media blob from OPFS:', err);
      } finally {
        if (!isCancelled) setMediaLoading(false);
      }
    }

    loadMediaBlob();

    return () => {
      isCancelled = true;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [workspaceId, localAnalysis?.mediaFileId]);

  // ── 1. Resolve Analysis from Dexie or Direct Backend Job ──────────────────

  const initializeWorkspace = useCallback(async () => {
    setIsLoadingStatus(true);
    setResultsError(null);

    try {
      let analysisRecord = null;
      if (workspaceId) {
        analysisRecord = await dataRepository.getAnalysisById(jobId, workspaceId);
      }

      if (analysisRecord) {
        setLocalAnalysis(analysisRecord);
        const effectiveJobId = analysisRecord.jobId || analysisRecord.id;
        setBackendJobId(effectiveJobId);

        // Check if results are already stored locally encrypted
        try {
          const cached = await dataRepository.getDecryptedResults(analysisRecord.id, workspaceId);
          if (cached) {
            setResults(cached.results || cached);
            setTranscriptData(
              cached.transcriptData || (cached.transcript ? { transcript: cached.transcript } : null)
            );
            setJobStatus({ status: 'completed' });
            setIsLoadingStatus(false);
            return;
          }
        } catch (decryptErr) {
          console.warn('Could not read cached encrypted results:', decryptErr);
        }

        // If local record is marked 'ready' or has no active job ID, wait for user to start
        if (analysisRecord.status === 'ready') {
          setJobStatus({ status: 'ready' });
          setIsLoadingStatus(false);
          return;
        }

        // If we have a backend job ID, probe status
        if (analysisRecord.jobId) {
          try {
            const statusData = await api.getJobStatus(analysisRecord.jobId);
            setJobStatus(statusData);
            if (statusData.status === 'completed') {
              await fetchAndPersistResults(analysisRecord.id, analysisRecord.jobId);
            }
          } catch (statusErr) {
            console.warn('Backend job status check failed:', statusErr);
            if (statusErr.status === 404 || statusErr.code === 'JOB_NOT_FOUND' || statusErr.code === 'HTTP_404') {
              // Remote job not found on server (e.g. server restart)
              // Preserve the local record and jobId rather than wiping destructively
              setJobStatus({
                status: 'failed',
                error: 'Processing job not found on server (it may have expired or server restarted).',
                isNotFound: true,
              });
            } else {
              setJobStatus({ status: analysisRecord.status || 'failed' });
            }
          }
        } else {
          setJobStatus({ status: analysisRecord.status || 'ready' });
        }
      } else {
        // Direct backend job identifier without local Dexie record
        setBackendJobId(jobId);
        try {
          const statusData = await api.getJobStatus(jobId);
          setJobStatus(statusData);
          if (statusData.status === 'completed') {
            await fetchAndPersistResults(jobId, jobId);
          }
        } catch (err) {
          console.warn('Direct job probe failed:', err);
          setJobStatus({
            status: 'failed',
            error: err.status === 404 ? `Job '${jobId}' was not found on server.` : (err.message || 'Job unavailable.'),
          });
        }
      }
    } catch (err) {
      console.error('Failed to initialize workspace:', err);
    } finally {
      setIsLoadingStatus(false);
    }
  }, [jobId, workspaceId]);

  useEffect(() => {
    initializeWorkspace();
  }, [initializeWorkspace]);

  // ── 2. Load Structured Results & Persist Encrypted ─────────────────────────

  const fetchAndPersistResults = async (targetAnalysisId, targetJobId) => {
    setIsLoadingResults(true);
    setResultsError(null);

    try {
      const [resData, txData] = await Promise.all([
        api.getJobResults(targetJobId),
        api.getJobTranscript(targetJobId).catch(() => null),
      ]);

      setResults(resData);
      setTranscriptData(txData);

      // Persist encrypted results to IndexedDB if workspace is unlocked
      if (workspaceId && targetAnalysisId) {
        try {
          await dataRepository.saveEncryptedResults(targetAnalysisId, workspaceId, {
            results: resData,
            transcriptData: txData,
          });

          // Update analysis record status
          await dataRepository.updateAnalysis(targetAnalysisId, workspaceId, {
            status: 'completed',
          });
        } catch (encErr) {
          console.warn('Could not persist encrypted results to Dexie:', encErr);
        }
      }
    } catch (err) {
      setResultsError(err.message || 'Failed to load analysis results from server.');
    } finally {
      setIsLoadingResults(false);
    }
  };

  // When ProcessingView signals completion or terminal failure
  const handleProcessingComplete = async (completedJob) => {
    setJobStatus(completedJob);
    if (completedJob?.status === 'completed') {
      setShowPipelineLog(false);
      const targetAnalysisId = localAnalysis?.id || jobId;
      const targetJobId = completedJob?.job_id || backendJobId || jobId;
      await fetchAndPersistResults(targetAnalysisId, targetJobId);
    }
  };

  // ── 3. Start AI Analysis from Ready State ─────────────────────────────────

  const handleStartAnalysisFromReady = async () => {
    if (!localAnalysis || !workspaceId) return;

    setIsStartingAnalysis(true);
    setResultsError(null);

    try {
      // Retrieve file from OPFS if available
      let fileToUpload = null;
      if (localAnalysis.mediaFileId && storageService.isAvailable()) {
        try {
          fileToUpload = await storageService.getMedia(workspaceId, localAnalysis.mediaFileId);
        } catch (opfsErr) {
          console.warn('Could not read media file from OPFS:', opfsErr);
        }
      }

      if (!fileToUpload) {
        throw new Error('Media file not found in local storage. Please create a new analysis.');
      }

      // Submit upload job to FastAPI backend
      const jobRes = await api.createUploadJob(
        fileToUpload,
        localAnalysis.language || 'auto'
      );

      // Update local record
      await dataRepository.updateAnalysis(localAnalysis.id, workspaceId, {
        jobId: jobRes.job_id,
        status: 'processing',
      });

      setBackendJobId(jobRes.job_id);
      setJobStatus({ status: 'queued' });
      setShowPrivacyModal(false);
    } catch (err) {
      setResultsError(err.message || 'Failed to start AI analysis.');
      setShowPrivacyModal(false);
    } finally {
      setIsStartingAnalysis(false);
    }
  };

  // ── 4. Client-side Download Handling ──────────────────────────────────────

  const handleDownloadTranscript = (e) => {
    if (transcriptData?.transcript) {
      e.preventDefault();
      const blob = new Blob([transcriptData.transcript], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(localAnalysis?.title || results?.title || 'transcript').replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const effectiveJobId = backendJobId || (localAnalysis?.jobId ? localAnalysis.jobId : (jobId && !jobId.startsWith('analysis_') ? jobId : ''));
  const analysisId = localAnalysis?.id || effectiveJobId;
  const downloadUrl = api.downloadTranscriptUrl(effectiveJobId);
  const wordCount = results?.word_count || transcriptData?.word_count || 0;

  const actionItemsCount = React.useMemo(
    () => parseListItems(results?.action_items).length,
    [results?.action_items]
  );
  const decisionsCount = React.useMemo(
    () => parseListItems(results?.key_decisions).length,
    [results?.key_decisions]
  );
  const questionsCount = React.useMemo(
    () => parseListItems(results?.questions).length,
    [results?.questions]
  );

  // ── Render Case A: Ready State (Local Media Stored, Awaiting Analysis) ─────
  if (!isLoadingStatus && jobStatus?.status === 'ready') {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-6 animate-in fade-in duration-150">
        <Link
          to="/history"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors font-sans"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to History</span>
        </Link>

        <div className="p-8 sm:p-10 rounded-2xl border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-850 shadow-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-ocean-100 dark:bg-navy-800 text-ocean-600 dark:text-ocean-400 flex items-center justify-center mx-auto border border-ocean-200 dark:border-navy-700">
            <Sparkles className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-display">
              {localAnalysis?.title || 'Media Ready for Analysis'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              This media is safely stored in your local workspace. Trigger AI analysis to generate transcripts, executive summaries, mind maps, and conversational RAG.
            </p>
          </div>

          {/* Media Player preview in Ready state */}
          {mediaBlobUrl && (
            <div className="rounded-xl overflow-hidden bg-navy-950 flex items-center justify-center max-h-[320px] shadow-inner max-w-lg mx-auto">
              {localAnalysis?.mediaType === 'audio' ? (
                <audio controls src={mediaBlobUrl} className="w-full p-3" />
              ) : (
                <video
                  controls
                  src={mediaBlobUrl}
                  poster={localAnalysis?.thumbnail || undefined}
                  className="w-full max-h-[320px] object-contain"
                />
              )}
            </div>
          )}

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200/80 dark:border-navy-750 text-xs text-left space-y-2 max-w-md mx-auto">
            <div className="flex justify-between">
              <span className="text-slate-400">Filename:</span>
              <span className="font-mono text-slate-700 dark:text-slate-200">{localAnalysis?.filename}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Language:</span>
              <span className="capitalize text-slate-700 dark:text-slate-200">{localAnalysis?.language || 'auto'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Storage:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Local OPFS (Private)</span>
            </div>
          </div>

          <div className="pt-2 flex justify-center">
            <Button
              variant="primary"
              size="lg"
              onClick={() => setShowPrivacyModal(true)}
              rightIcon={<Play className="w-4 h-4" />}
            >
              Start AI Analysis
            </Button>
          </div>
        </div>

        <PrivacyDisclosureModal
          isOpen={showPrivacyModal}
          onClose={() => setShowPrivacyModal(false)}
          onConfirm={handleStartAnalysisFromReady}
          isProcessing={isStartingAnalysis}
        />
      </div>
    );
  }

  // ── Render Loading State while initial records resolve ─────────────────────
  if (isLoadingStatus && !jobStatus) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Spinner size="lg" color="ocean" />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
          Loading workspace...
        </p>
      </div>
    );
  }

  // ── Render Case B: In Progress or Pipeline Log Stepper ─────────────────────
  if (
    showPipelineLog ||
    !jobStatus ||
    jobStatus.status === 'queued' ||
    jobStatus.status === 'processing' ||
    jobStatus.status === 'failed'
  ) {
    return (
      <div className="space-y-4">
        {jobStatus?.status === 'completed' && showPipelineLog && (
          <div className="max-w-3xl mx-auto flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPipelineLog(false)}
            >
              Back to Results Workspace
            </Button>
          </div>
        )}
        <ProcessingView
          jobId={effectiveJobId}
          onComplete={handleProcessingComplete}
          onStatusUpdate={(updated) => setJobStatus(updated)}
        />

        {jobStatus?.status === 'failed' && localAnalysis?.mediaFileId && (
          <div className="max-w-3xl mx-auto p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 flex items-center justify-between gap-4">
            <div className="text-xs text-amber-800 dark:text-amber-200">
              Your media file is preserved locally in private OPFS storage. You can restart the analysis pipeline anytime.
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowPrivacyModal(true)}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Re-analyze Local Media
            </Button>
          </div>
        )}

        <PrivacyDisclosureModal
          isOpen={showPrivacyModal}
          onClose={() => setShowPrivacyModal(false)}
          onConfirm={handleStartAnalysisFromReady}
          isProcessing={isStartingAnalysis}
        />
      </div>
    );
  }

  // ── Render Case C: Completed Results Workspace ─────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Workspace Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-navy-700">
        <div className="space-y-1.5">
          <Link
            to="/history"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors font-sans mb-0.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to History</span>
          </Link>

          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-white">
              {localAnalysis?.title || results?.title || 'Multimedia Analysis Workspace'}
            </h1>
            <Badge variant="success" dot size="sm">
              Completed
            </Badge>
            <Badge
              variant="neutral"
              size="sm"
              className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-navy-700 shadow-2xs font-medium"
            >
              <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Encrypted Locally</span>
            </Badge>
            {(results?.source_attribution || jobStatus?.source_attribution) && (
              <Badge variant="neutral" size="sm">
                {results?.source_attribution || jobStatus?.source_attribution}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-sans flex-wrap">
            <span>Job: <strong className="font-mono text-slate-700 dark:text-slate-300">{effectiveJobId.slice(0, 8)}...</strong></span>
            <span>&bull;</span>
            <span>{wordCount} words analyzed</span>
            <span>&bull;</span>
            <span>ChromaDB Vector Session</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 self-start lg:self-auto flex-wrap">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Activity className="w-3.5 h-3.5" />}
            onClick={() => setShowPipelineLog(true)}
          >
            Pipeline Log
          </Button>

          <a href={downloadUrl} download onClick={handleDownloadTranscript}>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Download Transcript
            </Button>
          </a>
        </div>
      </div>

      {/* ── Media Player (OPFS Video / Audio) ─────────────────────────────────── */}
      {mediaBlobUrl && (
        <div className="rounded-2xl border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-850 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <Video className="w-4 h-4 text-ocean-600 dark:text-ocean-400" />
              <span>Local Media Playback ({localAnalysis?.mediaType === 'audio' ? 'Audio' : 'Video'})</span>
              <Badge variant="neutral" size="sm" className="text-[10px] py-0 px-1.5">
                Private OPFS
              </Badge>
            </div>
            <button
              type="button"
              onClick={() => setIsPlayerCollapsed((prev) => !prev)}
              className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors inline-flex items-center gap-1 font-medium"
            >
              <span>{isPlayerCollapsed ? 'Show Player' : 'Hide Player'}</span>
            </button>
          </div>

          {!isPlayerCollapsed && (
            <div className="rounded-xl overflow-hidden bg-navy-950 flex items-center justify-center max-h-[380px] shadow-inner">
              {localAnalysis?.mediaType === 'audio' ? (
                <audio controls src={mediaBlobUrl} className="w-full p-4" />
              ) : (
                <video
                  controls
                  src={mediaBlobUrl}
                  poster={localAnalysis?.thumbnail || undefined}
                  className="w-full max-h-[380px] object-contain"
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Error Banner (if results fetch failed) ────────────────────────────── */}
      {resultsError && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{resultsError}</span>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => fetchAndPersistResults(analysisId, effectiveJobId)}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Retry Fetch
          </Button>
        </div>
      )}

      {/* ── Loading Spinner for Results ─────────────────────────────────────── */}
      {isLoadingResults && !results ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Spinner size="lg" color="ocean" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
            Retrieving structured intelligence and transcript...
          </p>
        </div>
      ) : (
        <>
          {/* ── Navigable Tab Strip ───────────────────────────────────────────── */}
          <div className="flex items-center gap-1 border-b border-slate-200 dark:border-navy-700 overflow-x-auto pb-px">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm border-b-2 transition-all duration-150 shrink-0 ${
                    isActive
                      ? 'border-ocean-600 text-ocean-600 dark:text-ocean-400 bg-ocean-50/60 dark:bg-navy-900/60 font-semibold shadow-2xs'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-navy-600 font-medium'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.id === 'actions' && results?.action_items !== undefined && (
                    <span
                      className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                        isActive
                          ? 'bg-ocean-100 dark:bg-navy-800 text-ocean-700 dark:text-ocean-300'
                          : 'bg-slate-200/70 dark:bg-navy-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {actionItemsCount}
                    </span>
                  )}
                  {tab.id === 'decisions' && results?.key_decisions !== undefined && (
                    <span
                      className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                        isActive
                          ? 'bg-ocean-100 dark:bg-navy-800 text-ocean-700 dark:text-ocean-300'
                          : 'bg-slate-200/70 dark:bg-navy-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {decisionsCount}
                    </span>
                  )}
                  {tab.id === 'questions' && results?.questions !== undefined && (
                    <span
                      className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                        isActive
                          ? 'bg-ocean-100 dark:bg-navy-800 text-ocean-700 dark:text-ocean-300'
                          : 'bg-slate-200/70 dark:bg-navy-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {questionsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Active Tab Panel Content (Preserved across switches) ── */}
          <div className="pt-2">
            <div className={activeTab === 'summary' ? 'block' : 'hidden'}>
              <ExecutiveSummaryPanel
                summaryText={results?.summary}
                wordCount={wordCount}
              />
            </div>

            <div className={activeTab === 'actions' ? 'block' : 'hidden'}>
              <ActionItemsPanel
                actionItemsText={results?.action_items}
              />
            </div>

            <div className={activeTab === 'decisions' ? 'block' : 'hidden'}>
              <DecisionsPanel
                decisionsText={results?.key_decisions}
              />
            </div>

            <div className={activeTab === 'questions' ? 'block' : 'hidden'}>
              <QuestionsPanel
                questionsText={results?.questions}
              />
            </div>

            <div className={activeTab === 'mindmap' ? 'block' : 'hidden'}>
              <React.Suspense
                fallback={
                  <div className="py-20 flex flex-col items-center justify-center space-y-2">
                    <Spinner size="md" color="ocean" />
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                      Loading mind map viewer module...
                    </p>
                  </div>
                }
              >
                <MermaidViewer chartCode={results?.mindmap} />
              </React.Suspense>
            </div>

            <div className={activeTab === 'chat' ? 'block' : 'hidden'}>
              <ChatPanel
                jobId={effectiveJobId}
                analysisId={analysisId}
                workspaceId={workspaceId}
              />
            </div>

            <div className={activeTab === 'transcript' ? 'block' : 'hidden'}>
              <TranscriptPanel
                jobId={effectiveJobId}
                transcriptText={transcriptData?.transcript || ''}
                wordCount={wordCount}
                sourceAttribution={results?.source_attribution || jobStatus?.source_attribution}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

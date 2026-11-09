import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import ProcessingView from '../components/processing/ProcessingView';

// Workspace Panels
import ExecutiveSummaryPanel from '../components/workspace/ExecutiveSummaryPanel';
import ActionItemsPanel from '../components/workspace/ActionItemsPanel';
import DecisionsPanel from '../components/workspace/DecisionsPanel';
import QuestionsPanel from '../components/workspace/QuestionsPanel';
import ChatPanel from '../components/workspace/ChatPanel';
import TranscriptPanel from '../components/workspace/TranscriptPanel';

const MermaidViewer = React.lazy(() => import('../components/workspace/MermaidViewer'));

import { api } from '../services/api';

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

  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState('summary');
  const [showPipelineLog, setShowPipelineLog] = useState(false);

  // Status & Data States
  const [jobStatus, setJobStatus] = useState(null);
  const [results, setResults] = useState(null);
  const [transcriptData, setTranscriptData] = useState(null);

  // Loading & Error States
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [resultsError, setResultsError] = useState(null);

  // Initial Status Check
  const checkStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const statusData = await api.getJobStatus(jobId);
      setJobStatus(statusData);

      if (statusData.status === 'completed') {
        loadResultsData();
      }
    } catch (err) {
      // If probing status fails, jobStatus remains null and ProcessingView handles connection
    } finally {
      setIsLoadingStatus(false);
    }
  };

  // Load Structured Results and Transcript
  const loadResultsData = async () => {
    setIsLoadingResults(true);
    setResultsError(null);
    try {
      const [resData, txData] = await Promise.all([
        api.getJobResults(jobId),
        api.getJobTranscript(jobId).catch(() => null),
      ]);
      setResults(resData);
      setTranscriptData(txData);
    } catch (err) {
      setResultsError(err.message || 'Failed to load analysis results from server.');
    } finally {
      setIsLoadingResults(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, [jobId]);

  // When ProcessingView signals completion
  const handleProcessingComplete = (completedJob) => {
    setJobStatus(completedJob);
    setShowPipelineLog(false);
    loadResultsData();
  };

  // 1. If job is not completed yet, or if user requested to view the pipeline stepper:
  if (
    isLoadingStatus ||
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
          jobId={jobId}
          onComplete={handleProcessingComplete}
        />
      </div>
    );
  }

  // 2. Completed Job — Results Workspace
  const downloadUrl = api.downloadTranscriptUrl(jobId);
  const wordCount = results?.word_count || transcriptData?.word_count || 0;

  return (
    <div className="space-y-6">
      {/* ── Workspace Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-navy-700">
        <div className="space-y-1.5">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors font-sans mb-0.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>New Ingestion</span>
          </Link>

          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-white">
              {results?.title || 'Multimedia Analysis Workspace'}
            </h1>
            <Badge variant="success" dot size="sm">
              Completed
            </Badge>
            {(results?.source_attribution || jobStatus?.source_attribution) && (
              <Badge variant="neutral" size="sm">
                {results?.source_attribution || jobStatus?.source_attribution}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-sans flex-wrap">
            <span>Job: <strong className="font-mono text-slate-700 dark:text-slate-300">{jobId.slice(0, 8)}...</strong></span>
            <span>•</span>
            <span>{wordCount} words analyzed</span>
            <span>•</span>
            <span>Isolated ChromaDB collection</span>
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

          <a href={downloadUrl} download>
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
            onClick={loadResultsData}
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
                  className={`flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors shrink-0 ${
                    isActive
                      ? 'border-ocean-600 text-ocean-600 dark:text-ocean-400 bg-ocean-50/50 dark:bg-navy-900/40'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-navy-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* ── Active Tab Panel Content ────────────────────────────────────── */}
          <div className="pt-2">
            {activeTab === 'summary' && (
              <ExecutiveSummaryPanel
                summaryText={results?.summary}
                wordCount={wordCount}
              />
            )}

            {activeTab === 'actions' && (
              <ActionItemsPanel
                actionItemsText={results?.action_items}
              />
            )}

            {activeTab === 'decisions' && (
              <DecisionsPanel
                decisionsText={results?.key_decisions}
              />
            )}

            {activeTab === 'questions' && (
              <QuestionsPanel
                questionsText={results?.questions}
              />
            )}

            {activeTab === 'mindmap' && (
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
            )}

            {activeTab === 'chat' && (
              <ChatPanel
                jobId={jobId}
              />
            )}

            {activeTab === 'transcript' && (
              <TranscriptPanel
                jobId={jobId}
                transcriptText={transcriptData?.transcript || ''}
                wordCount={wordCount}
                sourceAttribution={results?.source_attribution || jobStatus?.source_attribution}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

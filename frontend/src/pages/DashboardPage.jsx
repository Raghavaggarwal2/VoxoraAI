import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  PlusCircle,
  Video,
  FileAudio,
  Bookmark,
  FolderKanban,
  HardDrive,
  CheckCircle2,
  Clock,
  ArrowRight,
  Upload,
  MoreVertical,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { dataRepository } from '../database/data.repository';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import MediaThumbnail from '../components/common/MediaThumbnail';

/**
 * Format bytes into human-readable string (KB, MB, GB).
 */
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 MB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Screen 5 — Dashboard (Home)
 * Displays personalized welcome, real Dexie statistics, upload shortcut,
 * and recent analysis records with bookmark toggles.
 */
export default function DashboardPage() {
  const { activeWorkspace } = useWorkspace();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalAnalyses: 0,
    completedAnalyses: 0,
    savedAnalyses: 0,
    totalCollections: 0,
    storageBytes: 0,
  });
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  const workspaceId = activeWorkspace?.id;
  const displayName = activeWorkspace?.displayName || 'User';

  const loadDashboardData = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const [statsData, recentList] = await Promise.all([
        dataRepository.getWorkspaceStats(workspaceId),
        dataRepository.getAnalysesByWorkspace(workspaceId, { limit: 5, sort: 'newest' }),
      ]);
      setStats(statsData);
      setRecentAnalyses(recentList);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleToggleSave = async (e, analysisId) => {
    e.stopPropagation();
    try {
      await dataRepository.toggleSaveAnalysis(analysisId, workspaceId);
      // Reload stats and list
      loadDashboardData();
    } catch (err) {
      console.error('Failed to toggle save:', err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* ── 1. Welcome Header Section ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-display">
            Welcome back, {displayName}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Turn your videos and audio into actionable knowledge.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => navigate('/new-analysis')}
          leftIcon={<PlusCircle className="w-4 h-4" />}
        >
          New Analysis
        </Button>
      </div>

      {/* ── 2. Statistics & Prompt Grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Prominent Upload Prompt Card */}
        <div
          onClick={() => navigate('/new-analysis')}
          className="md:col-span-5 p-6 rounded-2xl border-2 border-dashed border-ocean-300 dark:border-navy-700 bg-white dark:bg-navy-850 hover:border-ocean-500 dark:hover:border-ocean-500/80 transition-all cursor-pointer flex flex-col justify-between group shadow-sm"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-ocean-50 dark:bg-navy-800 text-ocean-600 dark:text-ocean-400 flex items-center justify-center transition-transform group-hover:scale-105 border border-ocean-100 dark:border-navy-700">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                New Analysis
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Upload a video or audio file to extract insights, mind maps, and transcripts.
              </p>
            </div>
          </div>

          <div className="pt-4 flex items-center text-xs font-semibold text-ocean-600 dark:text-ocean-400 group-hover:translate-x-0.5 transition-transform">
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>

        {/* Real Stats Cards */}
        <div className="md:col-span-7 grid grid-cols-2 gap-4">
          {/* Total Analyses */}
          <div className="p-5 rounded-2xl bg-white dark:bg-navy-850 border border-slate-200 dark:border-navy-750 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 dark:text-slate-500">
              <span className="text-xs font-medium">Total Analyses</span>
              <Video className="w-4 h-4 text-ocean-600 dark:text-ocean-400" />
            </div>
            <div className="mt-4">
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-display">
                {stats.totalAnalyses}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                {stats.completedAnalyses} processed
              </p>
            </div>
          </div>

          {/* Saved Items */}
          <div className="p-5 rounded-2xl bg-white dark:bg-navy-850 border border-slate-200 dark:border-navy-750 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 dark:text-slate-500">
              <span className="text-xs font-medium">Saved Items</span>
              <Bookmark className="w-4 h-4 text-ocean-600 dark:text-ocean-400" />
            </div>
            <div className="mt-4">
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-display">
                {stats.savedAnalyses}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Bookmarked analyses
              </p>
            </div>
          </div>

          {/* Collections */}
          <div className="p-5 rounded-2xl bg-white dark:bg-navy-850 border border-slate-200 dark:border-navy-750 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 dark:text-slate-500">
              <span className="text-xs font-medium">Collections</span>
              <FolderKanban className="w-4 h-4 text-ocean-600 dark:text-ocean-400" />
            </div>
            <div className="mt-4">
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-display">
                {stats.totalCollections}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Custom categories
              </p>
            </div>
          </div>

          {/* Storage Used */}
          <div className="p-5 rounded-2xl bg-white dark:bg-navy-850 border border-slate-200 dark:border-navy-750 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 dark:text-slate-500">
              <span className="text-xs font-medium">Storage Used</span>
              <HardDrive className="w-4 h-4 text-ocean-600 dark:text-ocean-400" />
            </div>
            <div className="mt-4">
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-display">
                {formatBytes(stats.storageBytes)}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Local OPFS files
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Recent Analyses Section ───────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white font-sans">
            Recent Analyses
          </h2>
          {recentAnalyses.length > 0 && (
            <Link
              to="/history"
              className="text-xs font-semibold text-ocean-600 dark:text-ocean-400 hover:text-ocean-700 dark:hover:text-ocean-300 transition-colors inline-flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {recentAnalyses.length === 0 ? (
          /* Empty State */
          <div className="p-10 rounded-2xl border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-850 text-center space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-navy-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
              <Video className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No analyses yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Upload your first audio or video file to extract structured knowledge, summaries, and interactive insights.
              </p>
            </div>
            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/new-analysis')}
                leftIcon={<PlusCircle className="w-4 h-4" />}
              >
                Create First Analysis
              </Button>
            </div>
          </div>
        ) : (
          /* Recent Analyses List */
          <div className="space-y-2.5">
            {recentAnalyses.map((analysis) => {
              const isVideo = analysis.mediaType === 'video';
              const createdDate = new Date(analysis.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div
                  key={analysis.id}
                  onClick={() => navigate(`/workspace/${analysis.id}`)}
                  className="p-4 rounded-xl border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-850 hover:border-ocean-300 dark:hover:border-navy-650 transition-all flex items-center justify-between gap-4 cursor-pointer group shadow-xs"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Media Thumbnail */}
                    <MediaThumbnail analysis={analysis} size="md" />

                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-ocean-600 dark:group-hover:text-ocean-400 transition-colors">
                        {analysis.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="capitalize">{analysis.mediaType}</span>
                        <span>&bull;</span>
                        <span>{createdDate}</span>
                        {analysis.fileSize > 0 && (
                          <>
                            <span>&bull;</span>
                            <span>{formatBytes(analysis.fileSize)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Status Badge */}
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border ${
                        analysis.status === 'completed'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50'
                          : 'bg-ocean-50 dark:bg-ocean-950/40 text-ocean-600 dark:text-ocean-400 border-ocean-200 dark:border-ocean-800/50'
                      }`}
                    >
                      {analysis.status === 'completed' ? 'Completed' : 'Ready'}
                    </span>

                    {/* Bookmark Toggle */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleSave(e, analysis.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        analysis.isSaved
                          ? 'text-ocean-600 dark:text-ocean-400'
                          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                      }`}
                      title={analysis.isSaved ? 'Remove from Saved' : 'Save Analysis'}
                    >
                      <Bookmark
                        className="w-4 h-4"
                        fill={analysis.isSaved ? 'currentColor' : 'none'}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


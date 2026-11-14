import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Video,
  FileAudio,
  Bookmark,
  Trash2,
  Calendar,
  Clock,
  ArrowRight,
  PlusCircle,
  AlertTriangle,
  FolderPlus,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { dataRepository } from '../database/data.repository';
import Button from '../components/common/Button';
import Select from '../components/common/Select';
import MediaThumbnail from '../components/common/MediaThumbnail';

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Screen 9 — History Page
 * Displays all local video and audio analyses with search, type filters,
 * sorting, bookmark toggling, and atomic deletion with confirmation.
 */
export default function HistoryPage() {
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.id;

  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mediaType, setMediaType] = useState('all');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('newest');

  // Deletion modal state
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadAnalyses = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const list = await dataRepository.getAnalysesByWorkspace(workspaceId, {
        search,
        mediaType,
        status,
        sort,
      });
      setAnalyses(list);
    } catch (err) {
      console.error('Failed to load analyses:', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, search, mediaType, status, sort]);

  useEffect(() => {
    loadAnalyses();
  }, [loadAnalyses]);

  const handleToggleSave = async (e, id) => {
    e.stopPropagation();
    try {
      await dataRepository.toggleSaveAnalysis(id, workspaceId);
      loadAnalyses();
    } catch (err) {
      console.error('Failed to toggle save:', err);
    }
  };

  const confirmDelete = async () => {
    if (!deleteCandidate) return;
    setIsDeleting(true);
    try {
      await dataRepository.deleteAnalysis(deleteCandidate.id, workspaceId);
      setDeleteCandidate(null);
      loadAnalyses();
    } catch (err) {
      console.error('Failed to delete analysis:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-display">
            History
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            All your video and audio analyses.
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

      {/* ── Filters & Search Toolbar ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 bg-white dark:bg-navy-850 rounded-2xl border border-slate-200 dark:border-navy-750 shadow-sm">
        {/* Search input (6 cols) */}
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search analyses by title, description or filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-xl text-sm pl-9 pr-4 py-2 outline-none focus:border-ocean-600 dark:text-slate-100 placeholder-slate-400"
          />
        </div>

        {/* Media type filter (2 cols) */}
        <div className="sm:col-span-2">
          <Select
            size="sm"
            value={mediaType}
            onChange={(e) => setMediaType(e.target.value)}
            aria-label="Filter by media type"
          >
            <option value="all" className="bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-100">All Media</option>
            <option value="video" className="bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-100">Videos</option>
            <option value="audio" className="bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-100">Audios</option>
          </Select>
        </div>

        {/* Status filter (2 cols) */}
        <div className="sm:col-span-2">
          <Select
            size="sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="all" className="bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-100">All Statuses</option>
            <option value="completed" className="bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-100">Completed</option>
            <option value="ready" className="bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-100">Ready</option>
          </Select>
        </div>

        {/* Sort order (2 cols) */}
        <div className="sm:col-span-2">
          <Select
            size="sm"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort order"
          >
            <option value="newest" className="bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-100">Newest First</option>
            <option value="oldest" className="bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-100">Oldest First</option>
            <option value="title-asc" className="bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-100">Title (A-Z)</option>
          </Select>
        </div>
      </div>

      {/* ── Analyses List ──────────────────────────────────────── */}
      {analyses.length === 0 ? (
        <div className="p-12 rounded-2xl border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-850 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-navy-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
            <Video className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {search || mediaType !== 'all' || status !== 'all'
                ? 'No matching analyses'
                : 'No analyses recorded yet'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {search || mediaType !== 'all' || status !== 'all'
                ? 'Try clearing your search query or adjusting your filters.'
                : 'Create your first analysis to start extracting actionable knowledge.'}
            </p>
          </div>
          {(search || mediaType !== 'all' || status !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setMediaType('all');
                setStatus('all');
              }}
            >
              Reset Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {analyses.map((analysis) => {
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
                      {analysis.filename && (
                        <>
                          <span>&bull;</span>
                          <span className="font-mono text-[11px] truncate max-w-[120px]">
                            {analysis.filename}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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
                    className={`p-2 rounded-lg transition-colors ${
                      analysis.isSaved
                        ? 'text-ocean-600 dark:text-ocean-400'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800'
                    }`}
                    title={analysis.isSaved ? 'Remove from Saved' : 'Save Analysis'}
                  >
                    <Bookmark
                      className="w-4 h-4"
                      fill={analysis.isSaved ? 'currentColor' : 'none'}
                    />
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteCandidate(analysis);
                    }}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                    title="Delete Analysis"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Deletion Confirmation Modal ────────────────────────── */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-navy-850 border border-slate-200 dark:border-navy-700 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-sans">
                  Delete Analysis?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete <strong>{deleteCandidate.title}</strong>? Its local OPFS media and collection associations will also be removed.
            </p>

            <div className="pt-2 flex justify-end gap-2.5">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setDeleteCandidate(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={confirmDelete}
                isLoading={isDeleting}
              >
                Delete Permanently
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


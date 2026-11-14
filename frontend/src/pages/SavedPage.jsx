import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bookmark,
  Search,
  Video,
  FileAudio,
  ArrowRight,
  Clock,
  Sparkles,
  BookmarkCheck,
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
 * Screen 11 — Saved Page
 * Displays bookmarked analyses, transcripts, and key insights for the active workspace.
 */
export default function SavedPage() {
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.id;

  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');

  const loadSavedItems = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const list = await dataRepository.getAnalysesByWorkspace(workspaceId, {
        isSaved: true,
        search,
        sort,
      });
      setSavedItems(list);
    } catch (err) {
      console.error('Failed to load saved analyses:', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, search, sort]);

  useEffect(() => {
    loadSavedItems();
  }, [loadSavedItems]);

  const handleRemoveSaved = async (e, id) => {
    e.stopPropagation();
    try {
      await dataRepository.toggleSaveAnalysis(id, workspaceId);
      loadSavedItems();
    } catch (err) {
      console.error('Failed to remove from saved:', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-display">
            Saved
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Your bookmarked analyses, transcripts, and key insights.
          </p>
        </div>
      </div>

      {/* ── Toolbar: Search & Sort ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white dark:bg-navy-850 rounded-2xl border border-slate-200 dark:border-navy-750 shadow-sm">
        <div className="w-full sm:max-w-md relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search saved items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-xl text-sm pl-9 pr-4 py-2 outline-none focus:border-ocean-600 dark:text-slate-100 placeholder-slate-400"
          />
        </div>

        <div className="w-full sm:w-auto">
          <Select
            size="sm"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort saved items"
            className="w-full sm:w-44"
          >
            <option value="newest" className="bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-100">Newest First</option>
            <option value="oldest" className="bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-100">Oldest First</option>
            <option value="title-asc" className="bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-100">Title (A-Z)</option>
          </Select>
        </div>
      </div>

      {/* ── Saved Items List ───────────────────────────────────── */}
      {savedItems.length === 0 ? (
        <div className="p-12 rounded-2xl border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-850 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-ocean-50 dark:bg-navy-800 text-ocean-600 dark:text-ocean-400 flex items-center justify-center mx-auto border border-ocean-100 dark:border-navy-700">
            <Bookmark className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {search ? 'No matching saved items' : 'No saved items yet'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {search
                ? 'Try a different search term or clear the filter.'
                : 'Bookmark your important analyses from the Dashboard or History to access them quickly here.'}
            </p>
          </div>
          {!search && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/history')}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Browse History
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {savedItems.map((item) => {
            const isVideo = item.mediaType === 'video';
            const createdDate = new Date(item.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <div
                key={item.id}
                onClick={() => navigate(`/workspace/${item.id}`)}
                className="p-4 rounded-xl border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-850 hover:border-ocean-300 dark:hover:border-navy-650 transition-all flex items-center justify-between gap-4 cursor-pointer group shadow-xs"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <MediaThumbnail analysis={item} size="md" />

                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-ocean-600 dark:group-hover:text-ocean-400 transition-colors">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <span className="capitalize">{item.mediaType}</span>
                      <span>&bull;</span>
                      <span>{createdDate}</span>
                      {item.fileSize > 0 && (
                        <>
                          <span>&bull;</span>
                          <span>{formatBytes(item.fileSize)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border ${
                      item.status === 'completed'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50'
                        : 'bg-ocean-50 dark:bg-ocean-950/40 text-ocean-600 dark:text-ocean-400 border-ocean-200 dark:border-ocean-800/50'
                    }`}
                  >
                    {item.status === 'completed' ? 'Completed' : 'Ready'}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => handleRemoveSaved(e, item.id)}
                    className="p-2 rounded-lg text-ocean-600 dark:text-ocean-400 hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                    title="Remove from Saved"
                  >
                    <Bookmark className="w-4 h-4 fill-current" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


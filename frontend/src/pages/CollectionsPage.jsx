import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Folder,
  FolderOpen,
  FolderPlus,
  FolderMinus,
  Plus,
  Trash2,
  Edit2,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Search,
  Check,
  X,
  AlertCircle,
  AlertTriangle,
  FolderKanban,
  Calendar,
  Layers,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { dataRepository } from '../database/data.repository';
import Button from '../components/common/Button';
import FormField from '../components/common/FormField';
import Input from '../components/common/Input';
import MediaThumbnail from '../components/common/MediaThumbnail';
import Badge from '../components/common/Badge';

/**
 * Screen 10 — Collections & Local Folder System
 * Local-first folder organization for workspace analyses.
 * Allows users to create folders, navigate into them, manage their items,
 * and view thumbnails/details without altering the underlying media.
 */
export default function CollectionsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const folderId = searchParams.get('folder');

  const { activeWorkspace, isLoading: isWorkspaceLoading } = useWorkspace();
  const workspaceId = activeWorkspace?.id;

  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active folder view state (null = root folder grid; non-null = folder contents view)
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [collectionAnalyses, setCollectionAnalyses] = useState([]);
  const [allWorkspaceAnalyses, setAllWorkspaceAnalyses] = useState([]);
  const [loadingFolderItems, setLoadingFolderItems] = useState(false);
  const [folderSearchQuery, setFolderSearchQuery] = useState('');

  // Add analyses to folder modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalSearch, setAddModalSearch] = useState('');

  // Create / Edit folder modal state
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [activeCollectionForModal, setActiveCollectionForModal] = useState(null);
  const [nameInput, setNameInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deletion modal state
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load all collections for the workspace
  const loadCollections = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const list = await dataRepository.getCollectionsByWorkspace(workspaceId);
      setCollections(list);
      // Keep selected collection object updated if folder is open
      if (folderId) {
        const updated = list.find((c) => c.id === folderId);
        if (updated) setSelectedCollection(updated);
      } else {
        setSelectedCollection(null);
      }
    } catch (err) {
      console.error('Failed to load collections:', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, folderId]);

  useEffect(() => {
    loadCollections();
  }, [workspaceId, folderId]);

  // Sync selected collection from URL query param "?folder=<id>"
  useEffect(() => {
    if (!workspaceId) return;
    let isCancelled = false;

    if (folderId) {
      setLoadingFolderItems(true);
      dataRepository
        .getCollectionById(folderId, workspaceId)
        .then(async (col) => {
          if (isCancelled) return;
          if (col) {
            setSelectedCollection(col);
            const [inCol, allInWs] = await Promise.all([
              dataRepository.getAnalysesInCollection(col.id, workspaceId),
              dataRepository.getAnalysesByWorkspace(workspaceId),
            ]);
            if (isCancelled) return;
            setCollectionAnalyses(inCol);
            setAllWorkspaceAnalyses(allInWs);
          } else {
            setSelectedCollection(null);
            setSearchParams({}, { replace: true });
          }
        })
        .catch((err) => {
          console.error('Error opening folder from URL:', err);
          if (!isCancelled) setSelectedCollection(null);
        })
        .finally(() => {
          if (!isCancelled) setLoadingFolderItems(false);
        });
    } else {
      setSelectedCollection(null);
      setCollectionAnalyses([]);
    }

    return () => {
      isCancelled = true;
    };
  }, [workspaceId, folderId, setSearchParams]);

  // Open folder view via URL
  const openFolder = (col) => {
    setSelectedCollection(col);
    setFolderSearchQuery('');
    setSearchParams({ folder: col.id });
  };

  // Back to root folder grid via URL & clean state reset
  const closeFolder = () => {
    setSelectedCollection(null);
    setCollectionAnalyses([]);
    setFolderSearchQuery('');
    setSearchParams({}, { replace: true });
    navigate('/collections', { replace: true });
  };

  // Open Create Modal
  const openCreateModal = () => {
    setActiveCollectionForModal(null);
    setNameInput('');
    setDescInput('');
    setFormError('');
    setModalMode('create');
  };

  // Open Edit Modal
  const openEditModal = (col, e) => {
    if (e) e.stopPropagation();
    setActiveCollectionForModal(col);
    setNameInput(col.name);
    setDescInput(col.description || '');
    setFormError('');
    setModalMode('edit');
  };

  // Handle Create or Edit Submit
  const handleSaveCollection = async (e) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      setFormError('Folder name is required.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (modalMode === 'create') {
        const newCol = await dataRepository.createCollection({
          workspaceId,
          name: nameInput.trim(),
          description: descInput.trim(),
        });
        setModalMode(null);
        await loadCollections();
        // Automatically open the freshly created folder!
        if (newCol) {
          openFolder(newCol);
        }
      } else if (modalMode === 'edit' && activeCollectionForModal) {
        await dataRepository.updateCollection(activeCollectionForModal.id, workspaceId, {
          name: nameInput.trim(),
          description: descInput.trim(),
        });
        setModalMode(null);
        await loadCollections();
        if (selectedCollection?.id === activeCollectionForModal.id) {
          setSelectedCollection((prev) => ({
            ...prev,
            name: nameInput.trim(),
            description: descInput.trim(),
          }));
        }
      }
    } catch (err) {
      setFormError(err.message || 'Failed to save folder.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete Collection
  const confirmDelete = async () => {
    if (!deleteCandidate) return;
    setIsDeleting(true);
    try {
      await dataRepository.deleteCollection(deleteCandidate.id, workspaceId);
      if (selectedCollection?.id === deleteCandidate.id) {
        closeFolder();
      }
      setDeleteCandidate(null);
      await loadCollections();
    } catch (err) {
      console.error('Failed to delete folder:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle item in folder
  const toggleAnalysisInFolder = async (analysisId) => {
    if (!selectedCollection) return;
    const isCurrentlyIn = collectionAnalyses.some((a) => a.id === analysisId);

    try {
      if (isCurrentlyIn) {
        await dataRepository.removeAnalysisFromCollection(analysisId, selectedCollection.id, workspaceId);
        setCollectionAnalyses((prev) => prev.filter((a) => a.id !== analysisId));
      } else {
        await dataRepository.addAnalysisToCollection(analysisId, selectedCollection.id, workspaceId);
        const item = allWorkspaceAnalyses.find((a) => a.id === analysisId);
        if (item) {
          setCollectionAnalyses((prev) => [item, ...prev]);
        }
      }
      loadCollections();
    } catch (err) {
      console.error('Failed to update folder items:', err);
    }
  };

  // Filter analyses in currently open folder by search query
  const filteredFolderAnalyses = useMemo(() => {
    if (!folderSearchQuery.trim()) return collectionAnalyses;
    const q = folderSearchQuery.toLowerCase();
    return collectionAnalyses.filter(
      (a) =>
        a.title?.toLowerCase().includes(q) ||
        a.mediaType?.toLowerCase().includes(q)
    );
  }, [collectionAnalyses, folderSearchQuery]);

  // Filter analyses for the "Add to Folder" modal
  const filteredModalAnalyses = useMemo(() => {
    if (!addModalSearch.trim()) return allWorkspaceAnalyses;
    const q = addModalSearch.toLowerCase();
    return allWorkspaceAnalyses.filter((a) => a.title?.toLowerCase().includes(q));
  }, [allWorkspaceAnalyses, addModalSearch]);

  // If URL specified a folder but it is still loading from Dexie
  if (folderId && !selectedCollection) {
    return (
      <div className="space-y-6 animate-in fade-in duration-150">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <button
            type="button"
            onClick={closeFolder}
            className="inline-flex items-center gap-1.5 font-medium hover:text-ocean-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Collections</span>
          </button>
        </div>
        <div className="p-12 rounded-2xl border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-850 text-center text-sm text-slate-400 animate-pulse">
          Opening local folder...
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW A: FOLDER DETAIL (INSIDE A FOLDER)
  // ──────────────────────────────────────────────────────────────────────────
  if (folderId && selectedCollection) {
    return (
      <div className="space-y-6 animate-in fade-in duration-150">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm">
          <button
            type="button"
            onClick={closeFolder}
            className="inline-flex items-center gap-1.5 font-medium text-slate-500 hover:text-ocean-600 dark:text-slate-400 dark:hover:text-ocean-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Collections</span>
          </button>
          <span className="text-slate-300 dark:text-navy-700">/</span>
          <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white truncate">
            <FolderOpen className="w-4 h-4 text-ocean-600 dark:text-ocean-400 shrink-0" />
            <span className="truncate">{selectedCollection.name}</span>
          </div>
        </div>

        {/* Folder Header Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-navy-850 border border-slate-200 dark:border-navy-750 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-ocean-50 to-ocean-100/60 dark:from-navy-800 dark:to-navy-750 text-ocean-600 dark:text-ocean-400 flex items-center justify-center shrink-0 border border-ocean-200/80 dark:border-navy-700 shadow-xs">
              <FolderOpen className="w-7 h-7" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display truncate">
                  {selectedCollection.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-ocean-50 dark:bg-navy-800 text-ocean-700 dark:text-ocean-300 border border-ocean-200/60 dark:border-navy-700 shrink-0">
                  {collectionAnalyses.length} {collectionAnalyses.length === 1 ? 'analysis' : 'analyses'}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                {selectedCollection.description || 'Local encrypted folder. Media and intelligence analyses saved on this device.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsAddModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Analyses
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={(e) => openEditModal(selectedCollection, e)}
              leftIcon={<Edit2 className="w-4 h-4" />}
            >
              Rename
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => setDeleteCandidate(selectedCollection)}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20"
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Delete
            </Button>
          </div>
        </div>

        {/* Search Bar inside Folder (when items exist) */}
        {collectionAnalyses.length > 0 && (
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter items in this folder..."
              value={folderSearchQuery}
              onChange={(e) => setFolderSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-navy-850 border border-slate-200 dark:border-navy-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-ocean-500 transition-colors shadow-2xs"
            />
          </div>
        )}

        {/* Folder Content Listing */}
        {loadingFolderItems ? (
          <div className="p-12 text-center text-sm text-slate-400 animate-pulse">
            Loading folder contents...
          </div>
        ) : collectionAnalyses.length === 0 ? (
          /* Empty Folder State */
          <div className="p-12 rounded-2xl border-2 border-dashed border-slate-200 dark:border-navy-750 bg-white/50 dark:bg-navy-850/30 text-center flex flex-col items-center justify-center max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-ocean-50 dark:bg-navy-800 text-ocean-600 dark:text-ocean-400 flex items-center justify-center mb-3.5 border border-ocean-100 dark:border-navy-700">
              <FolderPlus className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              This folder is empty
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-5">
              Add your processed video and audio analyses from this workspace to keep them neatly grouped.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsAddModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Analyses to Folder
            </Button>
          </div>
        ) : filteredFolderAnalyses.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-navy-850 rounded-2xl border border-slate-200 dark:border-navy-750">
            No analyses matching "{folderSearchQuery}" found in this folder.
          </div>
        ) : (
          /* Analyses List in Folder */
          <div className="space-y-3">
            {filteredFolderAnalyses.map((analysis) => {
              const dateStr = new Date(analysis.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={analysis.id}
                  className="p-4 rounded-2xl border border-slate-200/90 dark:border-navy-750 bg-white dark:bg-navy-850 hover:border-ocean-300 dark:hover:border-navy-650 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group shadow-2xs"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <MediaThumbnail analysis={analysis} size="md" />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge
                          variant={
                            analysis.status === 'completed'
                              ? 'success'
                              : analysis.status === 'processing'
                              ? 'warning'
                              : 'neutral'
                          }
                          size="sm"
                          dot
                        >
                          {analysis.status === 'completed'
                            ? 'Completed'
                            : analysis.status === 'processing'
                            ? 'Processing'
                            : 'Ready'}
                        </Badge>
                        <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-navy-700">
                          {analysis.mediaType}
                        </span>
                        {analysis.wordCount > 0 && (
                          <span className="text-xs text-slate-400">
                            &bull; {analysis.wordCount.toLocaleString()} words
                          </span>
                        )}
                      </div>

                      <h3
                        onClick={() => navigate(`/workspace/${analysis.jobId || analysis.id}`)}
                        className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate cursor-pointer hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors"
                      >
                        {analysis.title}
                      </h3>

                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{dateStr}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/workspace/${analysis.jobId || analysis.id}`)}
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      Open Analysis
                    </Button>
                    <button
                      type="button"
                      onClick={() => toggleAnalysisInFolder(analysis.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                      title="Remove from folder"
                      aria-label="Remove from folder"
                    >
                      <FolderMinus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Modal: Add / Remove Analyses in This Folder ──────────────── */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-xl bg-white dark:bg-navy-850 border border-slate-200 dark:border-navy-750 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-navy-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-ocean-50 dark:bg-navy-800 text-ocean-600 dark:text-ocean-400 flex items-center justify-center shrink-0 border border-ocean-100 dark:border-navy-700">
                    <FolderPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Add Analyses to Folder
                    </h3>
                    <p className="text-xs text-slate-400">
                      {collectionAnalyses.length} selected for "{selectedCollection.name}"
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search in modal */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search analyses..."
                  value={addModalSearch}
                  onChange={(e) => setAddModalSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-ocean-500"
                />
              </div>

              {/* List of analyses with checkboxes */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[160px]">
                {filteredModalAnalyses.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No matching analyses found in this workspace.
                  </div>
                ) : (
                  filteredModalAnalyses.map((analysis) => {
                    const isIn = collectionAnalyses.some((a) => a.id === analysis.id);

                    return (
                      <div
                        key={analysis.id}
                        onClick={() => toggleAnalysisInFolder(analysis.id)}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer select-none ${
                          isIn
                            ? 'border-ocean-300 dark:border-ocean-700 bg-ocean-50/50 dark:bg-ocean-950/20'
                            : 'border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-900 hover:border-slate-300 dark:hover:border-navy-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <MediaThumbnail analysis={analysis} size="sm" showPlayBadge={false} />
                          <div className="truncate">
                            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                              {analysis.title}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {analysis.mediaType} &bull; {new Date(analysis.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                            isIn
                              ? 'bg-ocean-600 border-ocean-600 text-white'
                              : 'border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-850'
                          }`}
                        >
                          {isIn && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-navy-800 flex justify-end">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal: Rename Folder ────────────────────────────────────── */}
        {modalMode && (
          <FolderFormModal
            modalMode={modalMode}
            nameInput={nameInput}
            setNameInput={setNameInput}
            descInput={descInput}
            setDescInput={setDescInput}
            formError={formError}
            isSubmitting={isSubmitting}
            onClose={() => setModalMode(null)}
            onSubmit={handleSaveCollection}
          />
        )}

        {/* ── Modal: Delete Confirmation ──────────────────────────────── */}
        {deleteCandidate && (
          <FolderDeleteModal
            candidate={deleteCandidate}
            isDeleting={isDeleting}
            onClose={() => setDeleteCandidate(null)}
            onConfirm={confirmDelete}
          />
        )}
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW B: ROOT FOLDERS GRID (ALL COLLECTIONS)
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-display">
            Collections &amp; Folders
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Local encrypted folders to organize and group your multimedia analyses.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={openCreateModal}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Folder
        </Button>
      </div>

      {/* ── Folders Grid ────────────────────────────────────────── */}
      {loading || isWorkspaceLoading ? (
        <div className="p-12 text-center text-sm text-slate-400 animate-pulse">
          Loading folders...
        </div>
      ) : collections.length === 0 ? (
        /* Empty State */
        <div className="p-12 rounded-2xl border-2 border-dashed border-slate-200 dark:border-navy-750 bg-white/50 dark:bg-navy-850/30 text-center flex flex-col items-center justify-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-ocean-50 dark:bg-navy-800 text-ocean-600 dark:text-ocean-400 flex items-center justify-center mb-3.5 border border-ocean-100 dark:border-navy-700">
            <Folder className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            No folders created yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-5">
            Create folders to group related meetings, lectures, or research videos together on your device.
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={openCreateModal}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create First Folder
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {collections.map((col) => {
            const count = col.analysisCount || 0;
            return (
              <div
                key={col.id}
                onClick={() => openFolder(col)}
                className="p-5 rounded-2xl border border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-850 hover:border-ocean-400 dark:hover:border-navy-650 transition-all cursor-pointer group flex flex-col justify-between shadow-2xs relative hover:shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    {/* Folder Icon Tile */}
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-ocean-50 to-ocean-100/70 dark:from-navy-800 dark:to-navy-750 text-ocean-600 dark:text-ocean-400 flex items-center justify-center shrink-0 border border-ocean-200/80 dark:border-navy-700 group-hover:scale-105 transition-transform shadow-2xs">
                      <Folder className="w-5 h-5 fill-ocean-600/20" />
                    </div>

                    <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => openEditModal(col, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                        title="Rename Folder"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteCandidate(col);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                        title="Delete Folder"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-ocean-600 dark:group-hover:text-ocean-400 transition-colors">
                    {col.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 min-h-[2rem]">
                    {col.description || 'Local workspace folder'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                  <span className="font-medium text-slate-600 dark:text-slate-300">
                    {count} {count === 1 ? 'item' : 'items'}
                  </span>
                  <span className="text-ocean-600 dark:text-ocean-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    Open <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}

          {/* Quick Create Folder Card */}
          <div
            onClick={openCreateModal}
            className="p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-navy-700 bg-white/40 dark:bg-navy-850/40 hover:border-ocean-400 transition-all cursor-pointer flex flex-col items-center justify-center text-center min-h-[160px] group"
          >
            <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-400 group-hover:text-ocean-600 dark:group-hover:text-ocean-400 flex items-center justify-center mb-2.5 transition-colors">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-ocean-600 dark:group-hover:text-ocean-400 transition-colors">
              Create New Folder
            </span>
          </div>
        </div>
      )}

      {/* ── Modal: Create / Edit Folder ───────────────────────────── */}
      {modalMode && (
        <FolderFormModal
          modalMode={modalMode}
          nameInput={nameInput}
          setNameInput={setNameInput}
          descInput={descInput}
          setDescInput={setDescInput}
          formError={formError}
          isSubmitting={isSubmitting}
          onClose={() => setModalMode(null)}
          onSubmit={handleSaveCollection}
        />
      )}

      {/* ── Modal: Delete Confirmation ───────────────────────────── */}
      {deleteCandidate && (
        <FolderDeleteModal
          candidate={deleteCandidate}
          isDeleting={isDeleting}
          onClose={() => setDeleteCandidate(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

/**
 * Reusable Folder Create / Edit Form Modal
 */
function FolderFormModal({
  modalMode,
  nameInput,
  setNameInput,
  descInput,
  setDescInput,
  formError,
  isSubmitting,
  onClose,
  onSubmit,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-navy-850 border border-slate-200 dark:border-navy-700 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-navy-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-ocean-50 dark:bg-navy-800 text-ocean-600 dark:text-ocean-400 flex items-center justify-center">
              <Folder className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-sans">
              {modalMode === 'create' ? 'Create New Folder' : 'Rename Folder'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {formError && (
          <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <FormField label="Folder Name" id="folder-name" required>
            <Input
              id="folder-name"
              placeholder="e.g. Work Meetings, Machine Learning Lectures"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              autoFocus
            />
          </FormField>

          <FormField label="Description (Optional)" id="folder-desc">
            <textarea
              id="folder-desc"
              rows={2}
              placeholder="Optional notes or context about this folder..."
              value={descInput}
              onChange={(e) => setDescInput(e.target.value)}
              className="w-full bg-white dark:bg-navy-900 border border-slate-300 dark:border-navy-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm p-3 outline-none focus:border-ocean-600"
            />
          </FormField>

          <div className="pt-2 flex justify-end gap-2.5">
            <Button variant="ghost" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
              {modalMode === 'create' ? 'Create Folder' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Reusable Folder Deletion Confirmation Modal
 */
function FolderDeleteModal({ candidate, isDeleting, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-navy-850 border border-slate-200 dark:border-navy-700 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-sans">
              Delete Folder?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Only the folder grouping will be removed.
            </p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Are you sure you want to delete the folder <strong>{candidate.name}</strong>? Your video &amp; audio analyses will remain intact in your workspace history.
        </p>

        <div className="pt-2 flex justify-end gap-2.5">
          <Button
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="md"
            onClick={onConfirm}
            isLoading={isDeleting}
          >
            Delete Folder
          </Button>
        </div>
      </div>
    </div>
  );
}

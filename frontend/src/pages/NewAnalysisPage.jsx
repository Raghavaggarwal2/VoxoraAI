import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  Video,
  FileAudio,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  Sparkles,
  Layers,
  HelpCircle,
  FileText,
  ListTodo,
  GitFork,
  MessageSquare,
  Lock,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { dataRepository } from '../database/data.repository';
import { storageService } from '../database/storage.service';
import { api } from '../services/api';
import Button from '../components/common/Button';
import FormField from '../components/common/FormField';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import PrivacyDisclosureModal from '../components/workspace/PrivacyDisclosureModal';
import { generateVideoThumbnail } from '../utils/mediaThumbnail';

const SUPPORTED_EXTENSIONS = ['mp4', 'mov', 'mkv', 'webm', 'mp3', 'wav', 'm4a', 'aac', 'ogg'];
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB

const LANGUAGES = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'ja', label: 'Japanese' },
];

const ANALYSIS_DEPTHS = [
  { value: 'standard', label: 'Standard Analysis' },
  { value: 'deep', label: 'Deep Dive & Comprehensive' },
  { value: 'executive', label: 'Executive Brief' },
];

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Screen 6 — New Analysis Page
 * Supports drag-and-drop file selection, media validation, OPFS local storage,
 * and Dexie record creation without triggering cloud AI processing.
 */
export default function NewAnalysisPage() {
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('auto');
  const [depth, setDepth] = useState('standard');
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(null);

  const workspaceId = activeWorkspace?.id;

  const handleFile = (file) => {
    setError('');
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !SUPPORTED_EXTENSIONS.includes(ext)) {
      setError(
        `Unsupported file type .${ext}. Supported formats: ${SUPPORTED_EXTENSIONS.join(', ')}`
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('File size exceeds the 2 GB limit for local media storage.');
      return;
    }

    setSelectedFile(file);
    // Auto-populate title if empty
    if (!title) {
      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(baseName.charAt(0).toUpperCase() + baseName.slice(1));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOpenPrivacyModal = (e) => {
    if (e) e.preventDefault();
    if (!selectedFile) {
      setError('Please select a video or audio file to analyze.');
      return;
    }
    if (!title.trim()) {
      setError('Please provide an analysis title.');
      return;
    }
    setError('');
    setShowPrivacyModal(true);
  };

  // User authorizes AI processing in the Privacy Disclosure Modal
  const handleConfirmAndStartAnalysis = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const fileId = crypto.randomUUID();
      const mediaType = selectedFile.type.startsWith('audio') ? 'audio' : 'video';

      // 1. Save binary file to OPFS with verified write
      if (storageService.isAvailable()) {
        await storageService.saveMedia(
          workspaceId,
          fileId,
          selectedFile,
          selectedFile.name,
          selectedFile.type,
          { language, depth }
        );
      }

      // Extract random frame video thumbnail (YouTube style)
      let thumbnail = null;
      if (mediaType === 'video') {
        try {
          thumbnail = await generateVideoThumbnail(selectedFile);
        } catch (thumbErr) {
          console.warn('Video thumbnail capture notice:', thumbErr);
        }
      }

      // 2. Create Analysis Record in IndexedDB (status: processing)
      const analysisRecord = await dataRepository.createAnalysis({
        workspaceId,
        title: title.trim(),
        description: description.trim(),
        mediaType,
        filename: selectedFile.name,
        fileSize: selectedFile.size,
        language,
        mediaFileId: fileId,
        thumbnail,
        status: 'processing',
      });

      // 3. Submit file to FastAPI backend
      const jobRes = await api.createUploadJob(selectedFile, language);

      // 4. Update local record with returned job_id
      await dataRepository.updateAnalysis(analysisRecord.id, workspaceId, {
        jobId: jobRes.job_id,
        status: 'processing',
      });

      setShowPrivacyModal(false);

      // 5. Navigate to workspace view with backend job ID in state
      navigate(`/workspace/${analysisRecord.id}`, {
        state: { backendJobId: jobRes.job_id },
      });
    } catch (err) {
      console.error('Failed to start analysis job:', err);
      setError(err.message || 'Failed to submit file to AI processing engine.');
      setShowPrivacyModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Optional local-only persistence without triggering cloud AI
  const handleSaveLocallyOnly = async (e) => {
    if (e) e.preventDefault();
    if (!selectedFile) {
      setError('Please select a video or audio file.');
      return;
    }
    if (!title.trim()) {
      setError('Please provide an analysis title.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const fileId = crypto.randomUUID();
      const mediaType = selectedFile.type.startsWith('audio') ? 'audio' : 'video';

      if (storageService.isAvailable()) {
        await storageService.saveMedia(
          workspaceId,
          fileId,
          selectedFile,
          selectedFile.name,
          selectedFile.type,
          { language, depth }
        );
      }

      // Extract random frame video thumbnail (YouTube style)
      let thumbnail = null;
      if (mediaType === 'video') {
        try {
          thumbnail = await generateVideoThumbnail(selectedFile);
        } catch (thumbErr) {
          console.warn('Video thumbnail capture notice:', thumbErr);
        }
      }

      const analysisRecord = await dataRepository.createAnalysis({
        workspaceId,
        title: title.trim(),
        description: description.trim(),
        mediaType,
        filename: selectedFile.name,
        fileSize: selectedFile.size,
        language,
        mediaFileId: fileId,
        thumbnail,
        status: 'ready',
      });

      setSavedSuccess(analysisRecord);
    } catch (err) {
      setError(err.message || 'Failed to save local media record.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-display">
          New Analysis
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Upload a video or audio file to transcribe, analyze, and extract insights.
        </p>
      </div>

      {savedSuccess ? (
        /* ── Local Preparation / Saved State ──────────────────────────────── */
        <div className="p-8 sm:p-10 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-center space-y-4 max-w-xl mx-auto animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display">
              Media Stored in Local Workspace
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              <strong>{savedSuccess.title}</strong> has been saved to your local workspace and Origin Private File System.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-navy-850 border border-slate-200 dark:border-navy-700 text-xs text-left text-slate-600 dark:text-slate-300 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="font-semibold text-ocean-600 dark:text-ocean-400">Ready for Analysis</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Media File:</span>
              <span className="font-mono">{savedSuccess.filename}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Storage Location:</span>
              <span>Local Origin Private File System</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setShowPrivacyModal(true);
              }}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Start AI Analysis
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/history')}
            >
              View in History
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => {
                setSavedSuccess(null);
                setSelectedFile(null);
                setTitle('');
                setDescription('');
              }}
            >
              Analyze Another File
            </Button>
          </div>
        </div>
      ) : (
        /* ── Standard New Analysis Form (Screen 6 Reference) ───────────────── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form: Upload & Configuration (8 cols) */}
          <form onSubmit={handleOpenPrivacyModal} className="lg:col-span-8 space-y-6">
            {error && (
              <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 text-xs sm:text-sm flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Hidden Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,audio/*,.mp4,.mov,.mkv,.webm,.mp3,.wav,.m4a"
              onChange={(e) => handleFile(e.target.files?.[0])}
              className="hidden"
            />

            {/* Drag & Drop Area */}
            {!selectedFile ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 sm:p-12 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                  isDragOver
                    ? 'border-ocean-600 bg-ocean-50/50 dark:bg-navy-800/80 shadow-md'
                    : 'border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-850 hover:border-ocean-400'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-ocean-50 dark:bg-navy-800 text-ocean-600 dark:text-ocean-400 flex items-center justify-center mb-4 border border-ocean-100 dark:border-navy-700">
                  <Upload className="w-7 h-7" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Drag &amp; drop your video or audio here
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                  or click to browse from your device
                </p>

                <Button variant="secondary" size="sm" type="button">
                  Choose File
                </Button>

                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-5">
                  Supported: MP4, MOV, MKV, MP3, WAV, M4A &bull; Max size: 2 GB
                </p>
              </div>
            ) : (
              /* Selected File Summary Card */
              <div className="p-5 rounded-2xl border border-ocean-200 dark:border-navy-700 bg-white dark:bg-navy-850 shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-ocean-50 dark:bg-navy-800 text-ocean-600 dark:text-ocean-400 flex items-center justify-center shrink-0 border border-ocean-100 dark:border-navy-700">
                    {selectedFile.type.startsWith('audio') ? (
                      <FileAudio className="w-6 h-6" />
                    ) : (
                      <Video className="w-6 h-6" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatBytes(selectedFile.size)} &bull; {selectedFile.type || 'Media File'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                  title="Remove file"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Analysis Configuration Fields */}
            <div className="bg-white dark:bg-navy-850 border border-slate-200 dark:border-navy-750 rounded-2xl p-6 shadow-sm space-y-4">
              <FormField label="Analysis Title" id="analysis-title" required>
                <Input
                  id="analysis-title"
                  placeholder="e.g. Q4 Product Strategy Meeting"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </FormField>

              <FormField label="Description (Optional)" id="analysis-desc">
                <textarea
                  id="analysis-desc"
                  rows={2}
                  placeholder="Add notes, agenda items, or context for this analysis..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white dark:bg-navy-900 border border-slate-300 dark:border-navy-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm p-3 outline-none focus:border-ocean-600 focus:ring-2 focus:ring-ocean-500/20"
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Language" id="language-select">
                  <Select
                    id="language-select"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    {LANGUAGES.map((lang) => (
                      <option
                        key={lang.value}
                        value={lang.value}
                        className="bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-100"
                      >
                        {lang.label}
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField label="Analysis Depth" id="depth-select">
                  <Select
                    id="depth-select"
                    value={depth}
                    onChange={(e) => setDepth(e.target.value)}
                  >
                    {ANALYSIS_DEPTHS.map((d) => (
                      <option
                        key={d.value}
                        value={d.value}
                        className="bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-100"
                      >
                        {d.label}
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={handleSaveLocallyOnly}
                  disabled={!selectedFile || isSubmitting || isSaving}
                >
                  {isSaving ? 'Storing Locally...' : 'Store Locally Only'}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  disabled={!selectedFile || isSubmitting || isSaving}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Generate Insights
                </Button>
              </div>
            </div>
          </form>

          {/* Right Checklist: You'll Get (4 cols, Screen 6 Reference) */}
          <div className="lg:col-span-4 bg-white dark:bg-navy-850 border border-slate-200 dark:border-navy-750 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-sans">
                You'll Get
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Structured knowledge extracted from your media
              </p>
            </div>

            <ul className="space-y-3.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-sans">
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-ocean-50 dark:bg-navy-800 text-ocean-600 dark:text-ocean-400 flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <span>Accurate Transcript</span>
              </li>

              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-ocean-50 dark:bg-navy-800 text-ocean-600 dark:text-ocean-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span>Executive Summary</span>
              </li>

              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-ocean-50 dark:bg-navy-800 text-ocean-600 dark:text-ocean-400 flex items-center justify-center shrink-0">
                  <ListTodo className="w-3.5 h-3.5" />
                </div>
                <span>Action Items &amp; Owners</span>
              </li>

              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-ocean-50 dark:bg-navy-800 text-ocean-600 dark:text-ocean-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span>Key Decisions Made</span>
              </li>

              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-ocean-50 dark:bg-navy-800 text-ocean-600 dark:text-ocean-400 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-3.5 h-3.5" />
                </div>
                <span>Open Questions</span>
              </li>

              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-ocean-50 dark:bg-navy-800 text-ocean-600 dark:text-ocean-400 flex items-center justify-center shrink-0">
                  <GitFork className="w-3.5 h-3.5" />
                </div>
                <span>Visual Concept Mind Map</span>
              </li>

              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-ocean-50 dark:bg-navy-800 text-ocean-600 dark:text-ocean-400 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <span>AI Chat (RAG) Grounded in Content</span>
              </li>
            </ul>

            <div className="pt-3 border-t border-slate-100 dark:border-navy-750 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <Lock className="w-3.5 h-3.5 text-ocean-600 dark:text-ocean-400 shrink-0" />
              <span>Media is stored privately in OPFS on this machine.</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Privacy Disclosure & Cloud Consent Modal ──────────────── */}
      <PrivacyDisclosureModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        onConfirm={handleConfirmAndStartAnalysis}
        isProcessing={isSubmitting}
      />
    </div>
  );
}


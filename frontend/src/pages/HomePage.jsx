import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  FileAudio,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Cpu,
  Layers,
  Network,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { api } from '../services/api';

const SUPPORTED_EXTENSIONS = ['mp4', 'mp3', 'wav', 'm4a', 'webm', 'mkv', 'mov'];
const MAX_FILE_SIZE_MB = 200;

const LANGUAGES = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'ja', label: 'Japanese' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Upload Form State
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadLang, setUploadLang] = useState('auto');
  const [isSubmittingUpload, setIsSubmittingUpload] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // General Notification
  const [serverError, setServerError] = useState('');

  // Handle File Selection
  const handleFileChange = (file) => {
    setUploadError('');
    setServerError('');
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !SUPPORTED_EXTENSIONS.includes(extension)) {
      setUploadError(
        `Unsupported file type .${extension}. Allowed formats: ${SUPPORTED_EXTENSIONS.join(', ')}`
      );
      setSelectedFile(null);
      return;
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      setUploadError(
        `File size (${fileSizeMB.toFixed(1)} MB) exceeds the maximum allowed limit of ${MAX_FILE_SIZE_MB} MB.`
      );
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  // Handle Local Upload Submission
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!selectedFile) {
      setUploadError('Please select a media file to upload.');
      return;
    }

    setUploadError('');
    setIsSubmittingUpload(true);

    try {
      const response = await api.createUploadJob(selectedFile, uploadLang);

      if (response && response.job_id) {
        navigate(`/workspace/${response.job_id}`);
      } else {
        setServerError('Unexpected response from server. Please try again.');
      }
    } catch (err) {
      setServerError(err.message || 'Failed to upload and start media processing.');
    } finally {
      setIsSubmittingUpload(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const valueProps = [
    {
      icon: <Layers className="w-5 h-5 text-ocean-600 dark:text-ocean-400" />,
      title: 'Multimodal Audio Extraction',
      description:
        'Resamples high-fidelity audio up to 200MB into 16kHz mono WAV streams with silence-aware segment chunking.',
    },
    {
      icon: <Cpu className="w-5 h-5 text-ocean-600 dark:text-ocean-400" />,
      title: 'Groq Cloud Whisper',
      description:
        'State-of-the-art whisper-large-v3 model delivers near-instantaneous transcription with multilingual recognition.',
    },
    {
      icon: <Network className="w-5 h-5 text-ocean-600 dark:text-ocean-400" />,
      title: 'Hierarchical Mind Maps',
      description:
        'Dynamic visual tree structures rendered via Mermaid.js mapping core discussion points and topics.',
    },
    {
      icon: <MessageSquare className="w-5 h-5 text-ocean-600 dark:text-ocean-400" />,
      title: 'Grounded RAG Assistant',
      description:
        'Isolated vector store per media session in ChromaDB allowing interactive Q&A strictly grounded in the transcript.',
    },
  ];

  return (
    <div className="space-y-12">
      {/* ── Hero / Page Header ─────────────────────────────────────────────── */}
      <section className="text-center max-w-3xl mx-auto space-y-4 pt-4">
        <Badge variant="ocean" size="sm">
          Multimedia Intelligence Platform
        </Badge>
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-slate-900 dark:text-white tracking-tight">
          Transform audio &amp; video into structured intelligence
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
          Upload audio and video recordings to extract clean transcripts, structured summaries,
          action items, mind maps, and chat with your media.
        </p>
      </section>

      {/* ── Main Ingestion Card ────────────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto">
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b border-slate-200 dark:border-navy-700">
            <div className="w-9 h-9 rounded-lg bg-ocean-50 dark:bg-ocean-950/40 border border-ocean-200 dark:border-ocean-800 text-ocean-600 dark:text-ocean-400 flex items-center justify-center shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Upload Media File
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select an audio or video file from your computer to analyze
              </p>
            </div>
          </div>

          {/* Server Error Alert */}
          {serverError && (
            <div className="flex items-start gap-2 p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Local File Upload Form */}
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 font-sans">
                Select Media File
              </label>

              {/* Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  isDragOver
                    ? 'border-ocean-500 bg-ocean-50/50 dark:bg-ocean-950/20'
                    : 'border-slate-300 dark:border-navy-700 hover:border-slate-400 dark:hover:border-navy-600 bg-slate-50/50 dark:bg-navy-900/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".mp4,.mp3,.wav,.m4a,.webm,.mkv,.mov"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />

                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-300 flex items-center justify-center mx-auto">
                    <FileAudio className="w-5 h-5 text-ocean-600 dark:text-ocean-400" />
                  </div>
                  {selectedFile ? (
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        Click to browse or drag and drop
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        MP4, MP3, WAV, M4A, WEBM, MKV, MOV (Up to {MAX_FILE_SIZE_MB} MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {uploadError && (
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{uploadError}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="upload-language-select"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 font-sans"
              >
                Transcription Language
              </label>
              <select
                id="upload-language-select"
                value={uploadLang}
                onChange={(e) => setUploadLang(e.target.value)}
                className="w-full bg-white dark:bg-navy-900 border border-slate-300 dark:border-navy-700 rounded-lg text-slate-900 dark:text-slate-100 text-sm px-3.5 py-2 transition-colors duration-150 outline-none focus:border-ocean-600 focus:ring-2 focus:ring-ocean-500/20"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                isLoading={isSubmittingUpload}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {isSubmittingUpload ? 'Uploading & Processing...' : 'Upload & Analyze Media'}
              </Button>
            </div>
          </form>

          {/* Guarantee / Format Notice */}
          <div className="pt-4 border-t border-slate-200 dark:border-navy-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-ocean-600 dark:text-ocean-400" />
              Direct local upload with client-side validation
            </span>
            <span>Max 200 MB</span>
          </div>
        </Card>
      </section>

      {/* ── Value Propositions Grid ────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto space-y-6 pt-4">
        <div className="text-center space-y-1">
          <h2 className="font-display font-semibold text-xl text-slate-900 dark:text-white">
            End-to-End Multimodal Analysis
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Engineered with strict tenant isolation, zero cloud storage leaks, and production-grade AI models.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {valueProps.map((prop, idx) => (
            <Card key={idx} className="p-5 flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shrink-0">
                {prop.icon}
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-white">
                  {prop.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {prop.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Headphones,
  FileText,
  ListTodo,
  GitFork,
  MessageSquare,
  ArrowRight,
  Shield,
  HardDrive,
  Cpu,
  Lock,
  Play,
  Volume2,
  ExternalLink,
  Sparkles,
  KeyRound,
  FolderLock,
  Database,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
  Layers,
  Terminal,
  FileCode,
  FolderKanban,
} from 'lucide-react';
import LandingNavbar from '../components/navigation/LandingNavbar';
import LandingFooter from '../components/navigation/LandingFooter';
import Button from '../components/common/Button';
import FeatureCard from '../components/common/FeatureCard';
import PrivacyNotice from '../components/common/PrivacyNotice';

/**
 * Screen 1 — Landing Page
 * Faithfully implements Screen 1 from the visual reference specification.
 */
export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Headphones className="w-5 h-5 text-ocean-600 dark:text-ocean-400" />,
      title: 'Whisper Transcription',
      description: 'High-accuracy speech-to-text with Groq whisper-large-v3, timestamped chunks, language detection, & raw .txt export.',
    },
    {
      icon: <FileText className="w-5 h-5 text-ocean-600 dark:text-ocean-400" />,
      title: 'Executive Summaries',
      description: 'Structured overviews, core themes, and strategic takeaways synthesized via Groq LLM inference (llama-3.3-70b-versatile).',
    },
    {
      icon: <ListTodo className="w-5 h-5 text-ocean-600 dark:text-ocean-400" />,
      title: 'Action Item Extraction',
      description: 'Extracted deliverables, assigned action owners, and interactive checkboxes to monitor execution.',
    },
    {
      icon: <CheckCircle2 className="w-5 h-5 text-ocean-600 dark:text-ocean-400" />,
      title: 'Decisions & Questions',
      description: 'Extracts consensus outcomes, finalized choices, unresolved issues, and open questions automatically from recordings.',
    },
    {
      icon: <GitFork className="w-5 h-5 text-ocean-600 dark:text-ocean-400" />,
      title: 'Interactive Mind Maps',
      description: 'Automated Mermaid.js concept graphs rendered client-side with syntax auto-healing, pan, and zoom controls.',
    },
    {
      icon: <MessageSquare className="w-5 h-5 text-ocean-600 dark:text-ocean-400" />,
      title: 'Conversational RAG Chat',
      description: 'Context-grounded conversational search querying media transcripts via ChromaDB vector embeddings with citations.',
    },
    {
      icon: <FolderKanban className="w-5 h-5 text-ocean-600 dark:text-ocean-400" />,
      title: 'Collections & Tagging',
      description: 'Organize analyses into custom local collections with color tags, search filters, and fast discovery.',
    },
    {
      icon: <Lock className="w-5 h-5 text-ocean-600 dark:text-ocean-400" />,
      title: 'Encrypted Portability',
      description: 'Export and restore entire workspaces in encrypted .voxora bundles with complete cryptographic integrity.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-navy-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-150">
      <LandingNavbar />

      <main className="flex-1">
        {/* ── 1. Hero Section ── */}
        <section className="pt-10 sm:pt-14 pb-10 sm:pb-14 px-4 sm:px-8 lg:px-12 xl:px-16 max-w-[1536px] w-full mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-8 text-left">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold bg-ocean-50 dark:bg-navy-800 text-ocean-600 dark:text-ocean-300 border border-ocean-200/80 dark:border-navy-700 shadow-2xs">
                <Shield className="w-4 h-4" />
                <span>Local-First Workspace &bull; Privacy by Design</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12] font-display">
                Turn Videos &amp; Audio into{' '}
                <span className="text-ocean-600 dark:text-ocean-400">
                  Actionable Knowledge
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                Transcribe, summarize, extract key decisions, actions, and insights — all in one private, encrypted workspace stored safely on your machine.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  className="px-8 py-4 text-base font-semibold shadow-md"
                  onClick={() => navigate('/get-started')}
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  Get Started
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 py-4 text-base font-semibold"
                  onClick={() => {
                    const el = document.getElementById('features');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  See How It Works
                </Button>
              </div>
            </div>

            {/* Right Media Graphic Mockup */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-lg lg:max-w-xl bg-white dark:bg-navy-850 border border-slate-200 dark:border-navy-700 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden group">
                {/* Mockup screen header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-navy-750">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-xs font-mono text-slate-400 dark:text-slate-500 font-medium">
                    voxora_stream.mp4
                  </span>
                </div>

                {/* Video player screen representation */}
                <div className="my-5 aspect-video rounded-2xl bg-navy-900 flex items-center justify-center relative overflow-hidden border border-navy-750 shadow-inner">
                  <div className="absolute inset-0 bg-gradient-to-tr from-ocean-950/70 to-navy-900 flex flex-col justify-between p-5">
                    <div className="flex justify-between items-center text-white/80 text-xs sm:text-sm">
                      <span className="inline-flex items-center gap-2 bg-black/50 px-2.5 py-1 rounded-md backdrop-blur-xs">
                        <Volume2 className="w-3.5 h-3.5" /> 48 kHz Stereo
                      </span>
                      <span className="bg-ocean-600 px-2.5 py-1 rounded-md text-xs font-bold text-white shadow-xs">
                        AI Ready
                      </span>
                    </div>

                    <div className="flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-ocean-600 text-white flex items-center justify-center shadow-xl transition-transform group-hover:scale-105">
                        <Play className="w-6 h-6 ml-0.5 fill-current" />
                      </div>
                    </div>

                    {/* Timeline bar */}
                    <div className="space-y-1.5">
                      <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-ocean-500 rounded-full w-2/5" />
                      </div>
                      <div className="flex justify-between text-xs font-mono text-white/70">
                        <span>12:40</span>
                        <span>32:15</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Micro insights extracted badges */}
                <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm pt-2">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200/80 dark:border-navy-700 flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      3 Key Decisions
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200/80 dark:border-navy-700 flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-ocean-500 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      5 Action Items
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. Feature Highlights ── */}
        <section id="features" className="py-10 sm:py-14 px-4 sm:px-8 lg:px-12 xl:px-16 max-w-[1536px] w-full mx-auto scroll-mt-24">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-ocean-600 dark:text-ocean-400 font-sans mb-2">
              Core Capabilities
            </h2>
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight leading-tight">
              Everything needed to unlock media intelligence
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {features.map((feat, idx) => (
              <FeatureCard
                key={idx}
                icon={feat.icon}
                title={feat.title}
                description={feat.description}
                variant="pill"
              />
            ))}
          </div>
        </section>

        {/* ── 3. Privacy-First Section (Comprehensive Verified Architecture) ── */}
        <section id="privacy" className="py-10 sm:py-14 px-4 sm:px-8 lg:px-12 xl:px-16 max-w-[1536px] w-full mx-auto space-y-10 scroll-mt-24">
          <div className="text-center max-w-3xl mx-auto space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-ocean-50 dark:bg-navy-800 text-ocean-600 dark:text-ocean-300 border border-ocean-200/80 dark:border-navy-700 shadow-2xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero-Knowledge &amp; Local Architecture</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight leading-tight">
              Built for Privacy by Design
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Voxora AI is engineered as a local-first application. Your multimedia files, transcripts, extracted intelligence, and vector sessions remain on your device under client-side encryption.
            </p>
          </div>

          <PrivacyNotice variant="strip" />

          {/* 6 Implemented Technical Architecture Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 pt-2">
            {/* 1. Zero-Plaintext IndexedDB */}
            <div className="p-8 sm:p-9 rounded-3xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-850 space-y-4 shadow-sm hover:shadow-md hover:border-ocean-300 dark:hover:border-navy-600 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-ocean-50 dark:bg-navy-800 text-ocean-600 dark:text-ocean-400 flex items-center justify-center border border-ocean-100/60 dark:border-navy-700 shrink-0">
                  <HardDrive className="w-7 h-7" />
                </div>
                <h4 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-display">
                  Zero-Plaintext Storage
                </h4>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  Transcripts, summaries, action items, decisions, mind maps, and chat histories are stored exclusively in client-side IndexedDB via Dexie.js. Data is encrypted before writing to disk, ensuring zero plaintext exposure.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-navy-750 flex items-center justify-between text-xs font-mono text-ocean-600 dark:text-ocean-400">
                <span className="font-semibold">Dexie.js IndexedDB</span>
                <span className="px-2 py-0.5 rounded bg-ocean-50 dark:bg-navy-900 border border-ocean-200/60 dark:border-navy-700">AES-256-GCM</span>
              </div>
            </div>

            {/* 2. OPFS Media Sandbox */}
            <div className="p-8 sm:p-9 rounded-3xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-850 space-y-4 shadow-sm hover:shadow-md hover:border-ocean-300 dark:hover:border-navy-600 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-ocean-50 dark:bg-navy-800 text-ocean-600 dark:text-ocean-400 flex items-center justify-center border border-ocean-100/60 dark:border-navy-700 shrink-0">
                  <FolderLock className="w-7 h-7" />
                </div>
                <h4 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-display">
                  Private Media Sandbox
                </h4>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  Raw audio and video files reside in your browser's isolated Origin Private File System (OPFS) sandbox on your physical drive. No raw media is ever uploaded, hosted, or retained in cloud storage buckets.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-navy-750 flex items-center justify-between text-xs font-mono text-ocean-600 dark:text-ocean-400">
                <span className="font-semibold">HTML5 OPFS Engine</span>
                <span className="px-2 py-0.5 rounded bg-ocean-50 dark:bg-navy-900 border border-ocean-200/60 dark:border-navy-700">Zero Cloud S3</span>
              </div>
            </div>

            {/* 3. Web Crypto Key Derivation */}
            <div className="p-8 sm:p-9 rounded-3xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-850 space-y-4 shadow-sm hover:shadow-md hover:border-ocean-300 dark:hover:border-navy-600 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-ocean-50 dark:bg-navy-800 text-ocean-600 dark:text-ocean-400 flex items-center justify-center border border-ocean-100/60 dark:border-navy-700 shrink-0">
                  <Lock className="w-7 h-7" />
                </div>
                <h4 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-display">
                  Client Key Derivation
                </h4>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  Workspace encryption keys are derived on your CPU using the native Web Crypto API. We use PBKDF2 with 100,000 SHA-256 iterations and random 128-bit salts. Passwords and master keys never touch external servers.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-navy-750 flex items-center justify-between text-xs font-mono text-ocean-600 dark:text-ocean-400">
                <span className="font-semibold">Web Crypto API</span>
                <span className="px-2 py-0.5 rounded bg-ocean-50 dark:bg-navy-900 border border-ocean-200/60 dark:border-navy-700">100k Iterations</span>
              </div>
            </div>

            {/* 4. 24-Word Recovery Key */}
            <div className="p-8 sm:p-9 rounded-3xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-850 space-y-4 shadow-sm hover:shadow-md hover:border-ocean-300 dark:hover:border-navy-600 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-ocean-50 dark:bg-navy-800 text-ocean-600 dark:text-ocean-400 flex items-center justify-center border border-ocean-100/60 dark:border-navy-700 shrink-0">
                  <KeyRound className="w-7 h-7" />
                </div>
                <h4 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-display">
                  24-Word Recovery Phrase
                </h4>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  Every workspace generates a 24-word cryptographic recovery phrase using secure entropy. The master key is dual-wrapped, enabling complete emergency recovery without relying on centralized email reset links.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-navy-750 flex items-center justify-between text-xs font-mono text-ocean-600 dark:text-ocean-400">
                <span className="font-semibold">BIP-39 Mnemonic</span>
                <span className="px-2 py-0.5 rounded bg-ocean-50 dark:bg-navy-900 border border-ocean-200/60 dark:border-navy-700">Dual Wrapped Key</span>
              </div>
            </div>

            {/* 5. Pre-Analysis Privacy Opt-In */}
            <div className="p-8 sm:p-9 rounded-3xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-850 space-y-4 shadow-sm hover:shadow-md hover:border-ocean-300 dark:hover:border-navy-600 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-ocean-50 dark:bg-navy-800 text-ocean-600 dark:text-ocean-400 flex items-center justify-center border border-ocean-100/60 dark:border-navy-700 shrink-0">
                  <Cpu className="w-7 h-7" />
                </div>
                <h4 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-display">
                  Transparent AI Disclosures
                </h4>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  Media stays dormant in a local ready state until you choose to start processing. An explicit pre-flight modal details the exact audio chunks transmitted to Groq Whisper and LLM endpoints with zero secondary retention.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-navy-750 flex items-center justify-between text-xs font-mono text-ocean-600 dark:text-ocean-400">
                <span className="font-semibold">Groq Whisper + LLM</span>
                <span className="px-2 py-0.5 rounded bg-ocean-50 dark:bg-navy-900 border border-ocean-200/60 dark:border-navy-700">Zero Retention</span>
              </div>
            </div>

            {/* 6. Isolated ChromaDB & Local Embeddings */}
            <div className="p-8 sm:p-9 rounded-3xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-850 space-y-4 shadow-sm hover:shadow-md hover:border-ocean-300 dark:hover:border-navy-600 transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-ocean-50 dark:bg-navy-800 text-ocean-600 dark:text-ocean-400 flex items-center justify-center border border-ocean-100/60 dark:border-navy-700 shrink-0">
                  <Database className="w-7 h-7" />
                </div>
                <h4 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-display">
                  Isolated Vector DB &amp; RAG
                </h4>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  Conversational RAG search operates over ChromaDB vector collections strictly isolated per analysis job. Embeddings are generated with local HuggingFace models, preventing cross-job or global search leakage.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-navy-750 flex items-center justify-between text-xs font-mono text-ocean-600 dark:text-ocean-400">
                <span className="font-semibold">Local MiniLM-L6-v2</span>
                <span className="px-2 py-0.5 rounded bg-ocean-50 dark:bg-navy-900 border border-ocean-200/60 dark:border-navy-700">ChromaDB Isolated</span>
              </div>
            </div>
          </div>

          {/* Architecture Trust Flow Strip */}
          <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-navy-750 bg-slate-50/80 dark:bg-navy-850/60">
            <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 font-mono">
              Verified Data Boundary Guarantee
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
              <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700 space-y-1.5">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Client Browser (Device)
                </span>
                <p className="text-slate-500 dark:text-slate-400">
                  IndexedDB encrypted payloads, OPFS binary media sandbox, Web Crypto master keys.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700 space-y-1.5">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Local Python Backend
                </span>
                <p className="text-slate-500 dark:text-slate-400">
                  FastAPI service adapter, local HuggingFace embeddings, isolated ChromaDB collections.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700 space-y-1.5">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Ephemeral AI Inference
                </span>
                <p className="text-slate-500 dark:text-slate-400">
                  Groq Whisper speech-to-text, Groq LLM summarization. No data retention or model training.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4. Documentation & Technical Architecture Reference ── */}
        <section id="docs" className="py-10 sm:py-14 px-4 sm:px-8 lg:px-12 xl:px-16 max-w-[1536px] w-full mx-auto space-y-8 scroll-mt-24">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-ocean-50 dark:bg-navy-800 text-ocean-600 dark:text-ocean-300 border border-ocean-200/80 dark:border-navy-700 shadow-2xs">
              <BookOpen className="w-4 h-4" />
              <span>Technical Reference &amp; Documentation</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight leading-tight">
              Architecture &amp; Pipeline Documentation
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Complete reference documentation on the processing pipeline lifecycle, local storage layers, and FastAPI service endpoints.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Card 1: Pipeline Lifecycle */}
            <div className="p-8 sm:p-9 rounded-3xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-850 space-y-5 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-ocean-50 dark:bg-navy-800 text-ocean-600 dark:text-ocean-400 flex items-center justify-center border border-ocean-100 dark:border-navy-700 shrink-0">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display">
                      Pipeline Execution
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">6-Stage Job Workflow</span>
                  </div>
                </div>
                <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200/70 dark:border-navy-750">
                    <strong className="text-slate-900 dark:text-white block font-semibold mb-0.5">1. Media Ingestion &amp; OPFS</strong>
                    Video/audio saved to local OPFS; FFmpeg converts input to 16kHz mono WAV chunks.
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200/70 dark:border-navy-750">
                    <strong className="text-slate-900 dark:text-white block font-semibold mb-0.5">2. Groq Whisper Transcription</strong>
                    Transcribed via Groq whisper-large-v3 with automatic language detection &amp; timestamps.
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200/70 dark:border-navy-750">
                    <strong className="text-slate-900 dark:text-white block font-semibold mb-0.5">3. LLM Intelligence &amp; Mind Maps</strong>
                    Groq LLM extracts executive summaries, decisions, action items, and Mermaid graphs.
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200/70 dark:border-navy-750">
                    <strong className="text-slate-900 dark:text-white block font-semibold mb-0.5">4. ChromaDB Vector Embedding</strong>
                    Chunks embedded with local HuggingFace MiniLM and indexed in isolated job collections.
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-navy-750 text-xs font-mono text-ocean-600 dark:text-ocean-400">
                <span>Status Events: 0% → 100% Progress Tracking</span>
              </div>
            </div>

            {/* Card 2: REST API Endpoints */}
            <div className="p-8 sm:p-9 rounded-3xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-850 space-y-5 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-ocean-50 dark:bg-navy-800 text-ocean-600 dark:text-ocean-400 flex items-center justify-center border border-ocean-100 dark:border-navy-700 shrink-0">
                    <Terminal className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display">
                      FastAPI Endpoints
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">Backend Service Contract</span>
                  </div>
                </div>
                <div className="space-y-2.5 font-mono text-xs text-slate-700 dark:text-slate-300">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200/70 dark:border-navy-750">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">POST</span> /api/jobs/upload
                    <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Multipart audio/video upload; initiates processing pipeline</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200/70 dark:border-navy-750">
                    <span className="text-ocean-600 dark:text-ocean-400 font-bold">GET</span> /api/jobs/{'{job_id}'}/status
                    <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Poll progress percentage (0-100%) &amp; stage events</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200/70 dark:border-navy-750">
                    <span className="text-ocean-600 dark:text-ocean-400 font-bold">GET</span> /api/jobs/{'{job_id}'}/results
                    <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Structured intelligence (summary, actions, mind map)</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200/70 dark:border-navy-750">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">POST</span> /api/chat/{'{job_id}'}
                    <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Conversational LCEL RAG with grounded citations</p>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-navy-750 text-xs font-mono text-ocean-600 dark:text-ocean-400">
                <span>FastAPI + Pydantic v2 Request Validation</span>
              </div>
            </div>

            {/* Card 3: Storage & Cryptography Spec */}
            <div className="p-8 sm:p-9 rounded-3xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-850 space-y-5 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-ocean-50 dark:bg-navy-800 text-ocean-600 dark:text-ocean-400 flex items-center justify-center border border-ocean-100 dark:border-navy-700 shrink-0">
                    <FileCode className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display">
                      Security &amp; Storage Spec
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">Client-Side Architecture</span>
                  </div>
                </div>
                <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200/70 dark:border-navy-750 space-y-1">
                    <span className="font-semibold text-slate-900 dark:text-white block">Key Derivation (PBKDF2)</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">100,000 iterations, SHA-256 hash, 128-bit cryptographically secure random salt.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200/70 dark:border-navy-750 space-y-1">
                    <span className="font-semibold text-slate-900 dark:text-white block">Symmetric Cipher (AES-GCM)</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">256-bit AES-GCM with unique 96-bit initialization vectors per encrypted record.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200/70 dark:border-navy-750 space-y-1">
                    <span className="font-semibold text-slate-900 dark:text-white block">Emergency Recovery Key</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">24-word BIP-39 mnemonic; dual-wraps master key for complete self-custody recovery.</p>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-navy-750 text-xs font-mono text-ocean-600 dark:text-ocean-400">
                <span>Web Crypto API &bull; Zero External Auth</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. Call to Action Banner ── */}
        <section className="py-10 sm:py-14 px-4 sm:px-8 lg:px-12 xl:px-16 max-w-[1536px] w-full mx-auto text-center">
          <div className="p-10 sm:p-16 rounded-3xl border border-ocean-200 dark:border-navy-700 bg-gradient-to-b from-ocean-50/70 to-white dark:from-navy-850 dark:to-navy-900 shadow-md space-y-6 max-w-5xl mx-auto">
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight leading-tight">
              Ready to transform your audio and video?
            </h3>
            <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Create your private, local workspace in seconds without creating a cloud account.
            </p>
            <div className="pt-4 flex justify-center">
              <Button
                variant="primary"
                size="lg"
                className="px-10 py-4 text-base sm:text-lg font-semibold shadow-md"
                onClick={() => navigate('/get-started')}
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                Create Workspace
              </Button>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}


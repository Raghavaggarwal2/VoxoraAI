import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Sparkles,
  Video,
  Play,
  Mic,
  PlusCircle,
  UploadCloud,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import Logo from '../components/common/Logo';
import { useWorkspace } from '../context/WorkspaceContext';

/**
 * Screen 2 — Workspace Selection (/get-started)
 * Pixel-accurate reproduction of the approved Voxora AI workspace selection design.
 */
export default function WorkspaceSelectPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { importWorkspaceFile } = useWorkspace();

  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(null);

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError('');
    setImportSuccess(null);

    try {
      const result = await importWorkspaceFile(file, { renameOnConflict: true });
      setImportSuccess(result);
    } catch (err) {
      setImportError(err.message || 'Failed to import workspace archive.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#fbfdff] text-slate-900 font-sans relative overflow-x-hidden selection:bg-blue-100 selection:text-blue-900">
      {/* Hidden file input for .voxora backup archives */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".voxora,.zip"
        onChange={handleFileSelected}
        className="hidden"
      />

      {/* ── Background Soft Faded Waves (Soft, seamless, no dark stroke lines) ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
        <svg
          className="w-full h-full min-h-[780px]"
          viewBox="0 0 1440 900"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Upper sky gradient background */}
          <rect width="1440" height="900" fill="url(#basePageGradient)" />

          {/* Sweeping Left Flowing Ribbon Wave */}
          <path
            d="M -50,150 C 140,190 320,310 520,340 C 360,380 160,340 -50,290 Z"
            fill="url(#refWaveRibbonLeft)"
            opacity="0.6"
          />

          {/* Sweeping Right Flowing Ribbon Wave */}
          <path
            d="M 1490,140 C 1300,180 1120,300 920,340 C 1080,380 1280,340 1490,280 Z"
            fill="url(#refWaveRibbonRight)"
            opacity="0.6"
          />

          {/* Primary central wave dipping under visualizer */}
          <path
            d="M -50,230 C 240,250 420,370 720,340 C 1020,310 1200,230 1490,240 L 1490,0 L -50,0 Z"
            fill="url(#refWavePrimary)"
            opacity="0.5"
          />

          {/* Secondary lower soft wave layer fading into white */}
          <path
            d="M -50,270 C 220,290 420,410 720,380 C 1020,350 1220,260 1490,280 L 1490,900 L -50,900 Z"
            fill="url(#refWaveLower)"
            opacity="0.8"
          />

          <defs>
            {/* Page base background gradient */}
            <linearGradient id="basePageGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f5f9fe" />
              <stop offset="45%" stopColor="#fafcff" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>

            {/* Left Ribbon Gradient */}
            <linearGradient id="refWaveRibbonLeft" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d4e7fe" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#eff6ff" stopOpacity="0" />
            </linearGradient>

            {/* Right Ribbon Gradient */}
            <linearGradient id="refWaveRibbonRight" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#d4e7fe" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#eff6ff" stopOpacity="0" />
            </linearGradient>

            {/* Primary Wave Gradient */}
            <linearGradient id="refWavePrimary" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e3effe" />
              <stop offset="50%" stopColor="#eef5fe" />
              <stop offset="100%" stopColor="#e3effe" />
            </linearGradient>

            {/* Lower Wave to White */}
            <linearGradient id="refWaveLower" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f3f8fe" stopOpacity="0.7" />
              <stop offset="35%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* ── 1. Top Header ── */}
      <header className="w-full border-b border-slate-100/90 bg-white/90 backdrop-blur-xs sticky top-0 z-30">
        <div className="max-w-[1400px] w-full mx-auto px-6 sm:px-10 h-16 sm:h-18 flex items-center justify-between">
          <Logo size="md" to="/" />

          <div className="flex items-center gap-2 text-slate-800">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-[#2563eb]" />
            <span className="text-sm sm:text-[15px] font-semibold tracking-tight text-slate-800">
              Private Local Workspace
            </span>
          </div>
        </div>
      </header>

      {/* ── 2. Main Centered Content ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-10 z-10 w-full max-w-[1040px] mx-auto">
        {/* Eyebrow Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-bold tracking-wider uppercase bg-[#e9f2fe] text-[#2563eb] border border-[#d0e3fc] shadow-2xs mb-4">
          <Sparkles className="w-3.5 h-3.5 text-[#2563eb]" />
          <span>YOUR PRIVATE AI WORKSPACE</span>
        </div>

        {/* Hero Heading */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight font-display text-center mb-3">
          Welcome to your <span className="text-[#2563eb]">workspace.</span>
        </h1>

        {/* Supporting Text */}
        <p className="text-sm sm:text-base md:text-lg text-slate-600 font-normal text-center max-w-xl mx-auto leading-relaxed">
          Your media. Your intelligence. Your data stays under your control.
        </p>

        {/* ── Central Media / Audio Illustration ── */}
        <div className="my-7 sm:my-9 flex items-center justify-center gap-3 sm:gap-4 relative select-none">
          {/* Left Audio Waveform Symbol */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {[12, 22, 36, 52, 34, 20, 10].map((h, i) => (
              <span
                key={`left-audio-bar-${i}`}
                style={{ height: `${h}px` }}
                className="w-1 sm:w-1.25 bg-[#7cb7fc] rounded-full inline-block shrink-0"
              />
            ))}
          </div>

          {/* Capsule Pill Container with Video, Play, Mic */}
          <div className="h-[74px] sm:h-[80px] px-4 sm:px-6 rounded-3xl bg-[#f2f8ff] border border-[#d5e5fa] flex items-center justify-center gap-3 sm:gap-4 shadow-xs">
            {/* Video Squircle */}
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-white shadow-xs border border-slate-100 flex items-center justify-center text-[#2563eb] shrink-0">
              <Video className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            {/* Center Play Button Capsule with halo */}
            <div className="relative flex items-center justify-center mx-0.5 sm:mx-1">
              <div className="w-18 h-13 sm:w-20 sm:h-14 rounded-2xl bg-[#dbeafe]/90 shadow-[0_10px_20px_rgba(37,99,235,0.22)] flex items-center justify-center p-1">
                <div className="w-full h-full rounded-2xl bg-gradient-to-b from-[#3b82f6] to-[#1d4ed8] flex items-center justify-center border border-white/30">
                  <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-white ml-0.5" />
                </div>
              </div>
            </div>

            {/* Mic Squircle */}
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-white shadow-xs border border-slate-100 flex items-center justify-center text-[#2563eb] shrink-0">
              <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>

          {/* Right Audio Waveform Symbol */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {[10, 20, 34, 52, 36, 22, 12].map((h, i) => (
              <span
                key={`right-audio-bar-${i}`}
                style={{ height: `${h}px` }}
                className="w-1 sm:w-1.25 bg-[#7cb7fc] rounded-full inline-block shrink-0"
              />
            ))}
          </div>
        </div>

        {/* ── Status Feedback (Importing / Error / Success) ── */}
        {isImporting && (
          <div className="w-full max-w-2xl mb-6 p-4 rounded-2xl border border-blue-200 bg-blue-50/80 text-blue-900 text-xs sm:text-sm text-center animate-pulse shadow-sm">
            Decompressing and validating .voxora archive...
          </div>
        )}

        {importError && (
          <div className="w-full max-w-2xl mb-6 p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 text-xs sm:text-sm flex items-start gap-3 shadow-sm animate-in fade-in duration-150">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-rose-900">Import Failed</p>
              <p>{importError}</p>
            </div>
          </div>
        )}

        {importSuccess && (
          <div className="w-full max-w-2xl mb-6 p-5 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-900 text-xs sm:text-sm space-y-3 shadow-sm animate-in fade-in duration-150">
            <div className="flex items-center gap-2 font-semibold text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Workspace "{importSuccess.workspaceName}" Successfully Imported!</span>
            </div>
            <p className="text-emerald-800">
              The encrypted key envelopes and settings have been safely restored. You can now unlock it using its original password or recovery key.
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => navigate('/unlock')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl inline-flex items-center gap-2 text-xs transition-colors cursor-pointer"
              >
                <span>Proceed to Unlock</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ── 3. Workspace Cards Grid (Rectangular & Proportional to Reference) ── */}
        <div className="w-full max-w-[840px] grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 z-10">
          {/* Card 1 — Create a workspace */}
          <div className="relative overflow-hidden rounded-[24px] sm:rounded-[26px] bg-gradient-to-br from-[#0c2340] via-[#0b213d] to-[#07162b] p-6 sm:p-7 flex flex-col justify-between shadow-xl border border-[#1a3a60] group transition-all duration-200 hover:shadow-2xl hover:border-ocean-500/50 min-h-[200px] sm:min-h-[215px]">
            {/* Luminous decorative wave SVG cleanly anchored to the bottom-right corner */}
            <svg
              className="absolute bottom-0 right-0 w-[55%] h-[78%] pointer-events-none select-none z-0"
              viewBox="0 0 200 130"
              fill="none"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0,130 C40,110 80,105 130,70 C160,50 180,25 200,0 L200,130 Z"
                fill="url(#cardWave1)"
                opacity="0.3"
              />
              <path
                d="M25,130 C65,115 105,100 150,65 C175,45 190,25 200,10 L200,130 Z"
                fill="url(#cardWave2)"
                opacity="0.6"
              />
              <path
                d="M60,130 C100,125 135,105 165,80 C185,60 195,45 200,30 L200,130 Z"
                fill="url(#cardWave3)"
                opacity="0.85"
              />
              <defs>
                <linearGradient id="cardWave1" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0369a1" />
                  <stop offset="100%" stopColor="#0ea5e9" />
                </linearGradient>
                <linearGradient id="cardWave2" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0284c7" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
                <linearGradient id="cardWave3" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0284c7" />
                  <stop offset="100%" stopColor="#60a5fa" />
                </linearGradient>
              </defs>
            </svg>

            {/* Top row: Icon on left, Title + Description on right */}
            <div className="relative z-10 flex items-start gap-4">
              <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-[#1b355e]/90 border border-[#2b518c]/60 flex items-center justify-center shrink-0 shadow-inner">
                <PlusCircle className="w-6 h-6 sm:w-6.5 sm:h-6.5 text-[#38bdf8]" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight font-display">
                  Create a workspace
                </h3>
                <p className="text-slate-300 text-xs sm:text-[13px] leading-relaxed max-w-[270px]">
                  Start fresh with an encrypted local workspace for your media, transcripts and AI insights.
                </p>
              </div>
            </div>

            {/* Bottom row: Button aligned to the left */}
            <div className="relative z-10 pt-4">
              <button
                type="button"
                onClick={() => navigate('/create-workspace')}
                className="bg-white hover:bg-slate-100 active:scale-98 text-slate-900 font-semibold px-5 py-2.5 rounded-full inline-flex items-center gap-2 text-xs sm:text-sm shadow-md transition-all duration-150 cursor-pointer"
              >
                <span>Create workspace</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>
          </div>

          {/* Card 2 — Import a workspace */}
          <div className="relative overflow-hidden rounded-[24px] sm:rounded-[26px] bg-white p-6 sm:p-7 flex flex-col justify-between shadow-sm border border-slate-200/90 group transition-all duration-200 hover:shadow-md hover:border-ocean-300 min-h-[200px] sm:min-h-[215px]">
            {/* Top row: Icon on left, Title + Description on right */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-[#eff6ff] border border-[#dbeafe]/80 flex items-center justify-center shrink-0 shadow-xs">
                <UploadCloud className="w-6 h-6 sm:w-6.5 sm:h-6.5 text-[#2563eb]" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight font-display">
                  Import a workspace
                </h3>
                <p className="text-slate-600 text-xs sm:text-[13px] leading-relaxed max-w-[270px]">
                  Restore your previous analyses, conversations and settings from a .voxora backup.
                </p>
              </div>
            </div>

            {/* Bottom row: Button aligned to the left */}
            <div className="pt-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#eff6ff] hover:bg-[#dbeafe] active:scale-98 text-[#2563eb] font-semibold px-5 py-2.5 rounded-full inline-flex items-center gap-2 text-xs sm:text-sm transition-all duration-150 cursor-pointer border border-[#bfdbfe]/60"
              >
                <span>Import backup</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── 4. Unlock Section ── */}
        <div className="w-full max-w-[840px] flex items-center justify-center gap-3 sm:gap-4 my-7 sm:my-8 px-4">
          <div className="h-px bg-slate-200/90 flex-1 max-w-[140px] sm:max-w-[220px]" />
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600">
            <span>Already have a workspace?</span>
            <button
              type="button"
              onClick={() => navigate('/unlock')}
              className="text-[#2563eb] hover:text-blue-700 font-semibold inline-flex items-center gap-1 hover:underline transition-colors cursor-pointer ml-1"
            >
              <span>Unlock existing workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-px bg-slate-200/90 flex-1 max-w-[140px] sm:max-w-[220px]" />
        </div>
      </main>

      {/* ── 5. Footer ── */}
      <footer className="w-full py-4 sm:py-5 px-4 z-10">
        <div className="flex items-center justify-center gap-3 text-xs sm:text-sm text-slate-600">
          <div className="w-7 h-7 rounded-lg bg-[#eff6ff] text-[#2563eb] flex items-center justify-center border border-[#dbeafe]/80 shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div className="h-4 w-px bg-slate-200 mx-0.5" />
          <p className="text-slate-600 text-center sm:text-left text-xs sm:text-sm">
            <span className="font-bold text-slate-900">Private by design.</span>{' '}
            <span>Your workspace is encrypted and stored locally on this device.</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

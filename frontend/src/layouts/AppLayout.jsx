import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Video, Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import BackendStatusPill from '../components/common/BackendStatusPill';

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const navItems = [
    { label: 'New Analysis', path: '/' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-900 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      {/* ── Top Header (Solid, No Blur) ────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white dark:bg-navy-850 border-b border-slate-200 dark:border-navy-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-ocean-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-tight">
                <span className="font-display font-bold text-base tracking-tight text-slate-900 dark:text-white">
                  Voxora
                </span>
                <span className="text-[11px] font-semibold text-ocean-700 dark:text-ocean-300 px-1.5 py-0.2 rounded bg-ocean-50 dark:bg-navy-900 border border-ocean-200 dark:border-navy-700">
                  AI
                </span>
              </div>
              <p className="text-[10px] font-mono tracking-wider text-slate-500 dark:text-slate-400">
                MULTIMEDIA INTELLIGENCE
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'text-ocean-600 dark:text-ocean-400 bg-ocean-50 dark:bg-navy-800'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Header Controls */}
          <div className="hidden sm:flex items-center gap-3">
            <BackendStatusPill />

            {/* Light / Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-750 transition-colors shadow-sm"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu (Solid) */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pt-2 pb-4 border-b border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-850 space-y-3">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-ocean-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-navy-700">
              <BackendStatusPill />
            </div>
          </div>
        )}
      </header>

      {/* ── Main Page Content ────────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <Outlet />
      </main>

      {/* ── Editorial Footer (Solid) ────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-850 py-6 text-xs text-slate-500 dark:text-slate-400 font-sans">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Voxora AI · Multimedia Intelligence Platform</p>
          <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
            <span>FastAPI</span>
            <span>•</span>
            <span>React</span>
            <span>•</span>
            <span>Groq Whisper</span>
            <span>•</span>
            <span>Mistral AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

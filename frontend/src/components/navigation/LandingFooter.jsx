import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../common/Logo';
import { Shield, Sparkles, HardDrive, Lock } from 'lucide-react';

/**
 * Public Landing Footer adhering strictly to Coastal Navy styling and
 * local-first privacy transparency requirements.
 */
export default function LandingFooter() {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-950 text-slate-600 dark:text-slate-400 font-sans transition-colors duration-150">
      <div className="max-w-[1536px] w-full mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 pt-10 pb-4 sm:pt-12 sm:pb-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-10 mb-8">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-4">
            <Logo size="md" />
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed">
              Voxora AI is a private, local-first multimedia intelligence workspace. Turn your videos and audio recordings into structured summaries, action items, mind maps, and interactive conversations.
            </p>
            <div className="inline-flex items-center gap-2 text-xs sm:text-sm text-ocean-600 dark:text-ocean-400 font-semibold bg-ocean-50 dark:bg-navy-800 px-3 py-1.5 rounded-lg border border-ocean-100 dark:border-navy-700">
              <Lock className="w-3.5 h-3.5" />
              <span>Zero-knowledge client architecture</span>
            </div>
          </div>

          {/* Product links */}
          <div className="space-y-3">
            <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 font-sans">
              Product
            </h4>
            <ul className="space-y-2 text-sm sm:text-base">
              <li>
                <a href="#features" className="hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#privacy" className="hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors">
                  Privacy Architecture
                </a>
              </li>
              <li>
                <Link to="/get-started" className="hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors">
                  Workspace Setup
                </Link>
              </li>
              <li>
                <Link to="/unlock" className="hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors">
                  Unlock Workspace
                </Link>
              </li>
            </ul>
          </div>

          {/* Privacy & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 font-sans">
              Transparency
            </h4>
            <ul className="space-y-2 text-sm sm:text-base">
              <li>
                <a href="#privacy" className="hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors">
                  Local-First Storage
                </a>
              </li>
              <li>
                <a href="#docs" className="hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors">
                  AI Provider Disclosures
                </a>
              </li>
              <li>
                <span className="text-slate-400 dark:text-slate-500 text-xs sm:text-sm font-mono">
                  Voxora 2.0 &bull; Local Encrypted
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-200/80 dark:border-navy-800 pt-4 pb-1 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} Voxora AI. Local-first multimedia intelligence.</p>
          <div className="flex items-center gap-6">
            <span>Built with privacy by design</span>
          </div>
        </div>
      </div>
    </footer>
  );
}


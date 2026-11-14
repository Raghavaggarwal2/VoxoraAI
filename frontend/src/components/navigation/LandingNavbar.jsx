import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sun, Moon, Menu, X, ArrowRight, ShieldCheck } from 'lucide-react';
import Logo from '../common/Logo';
import Button from '../common/Button';
import { useTheme } from '../../context/ThemeContext';

/**
 * Public Landing Navbar matching Screen 1 in the design specification.
 * Features brand logo, navigation links with active state styling, theme toggle, and CTA.
 */
export default function LandingNavbar() {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { label: 'Features', href: '#features', id: 'features' },
    { label: 'Privacy', href: '#privacy', id: 'privacy' },
    { label: 'Docs', href: '#docs', id: 'docs' },
  ];

  // Active section tracking via scroll spy with dismissal at top and bottom
  useEffect(() => {
    const handleScroll = () => {
      // 1. Dismiss if scrolled to the bottom of the page (CTA & Footer)
      const isNearBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 160;
      if (isNearBottom) {
        setActiveSection('');
        return;
      }

      // 2. Dismiss if scrolled near the top (Hero area)
      if (window.scrollY < 200) {
        setActiveSection('');
        return;
      }

      // 3. Match active section by viewport offset
      const navOffset = 100;
      const sectionIds = ['docs', 'privacy', 'features'];
      let currentSection = '';

      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop - navOffset;
          const bottom = top + el.offsetHeight;
          if (window.scrollY >= top && window.scrollY < bottom) {
            currentSection = id;
            break;
          }
        }
      }

      setActiveSection(currentSection);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const isUnlockActive = location.pathname === '/unlock';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-navy-750 bg-white/95 dark:bg-navy-900/95 backdrop-blur-md transition-colors duration-150">
      <div className="max-w-[1536px] w-full mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 h-18 sm:h-20 flex items-center justify-between">
        {/* Brand */}
        <Logo size="md" />

        {/* Desktop Links with Active Styling */}
        <nav className="hidden md:flex items-center gap-2.5 lg:gap-3.5">
          {navLinks.map((item) => {
            const isActive = activeSection === item.id;

            return (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  const target = document.getElementById(item.id);
                  if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                    setActiveSection(item.id);
                  }
                }}
                className={`text-sm sm:text-[15px] font-medium px-4 py-2 rounded-xl transition-all duration-150 ${
                  isActive
                    ? 'text-ocean-600 dark:text-ocean-400 font-semibold bg-ocean-50 dark:bg-navy-800 border border-ocean-200/80 dark:border-navy-700 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-ocean-600 dark:hover:text-ocean-400 hover:bg-slate-100/70 dark:hover:bg-navy-800/50'
                }`}
              >
                {item.label}
              </a>
            );
          })}

          <Link
            to="/unlock"
            className={`text-sm sm:text-[15px] font-medium px-4 py-2 rounded-xl transition-all duration-150 inline-flex items-center gap-1.5 ${
              isUnlockActive
                ? 'text-ocean-600 dark:text-ocean-400 font-semibold bg-ocean-50 dark:bg-navy-800 border border-ocean-200/80 dark:border-navy-700 shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-ocean-600 dark:hover:text-ocean-400 hover:bg-slate-100/70 dark:hover:bg-navy-800/50'
            }`}
          >
            <ShieldCheck className={`w-4 h-4 ${isUnlockActive ? 'text-ocean-600 dark:text-ocean-400' : 'text-ocean-500'}`} />
            <span>Unlock</span>
          </Link>
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-3.5">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle color theme"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <Button
            variant="primary"
            size="md"
            className="px-5 py-2.5 text-sm sm:text-[15px] font-semibold shadow-xs"
            onClick={() => navigate('/get-started')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Get Started
          </Button>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle color theme"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-navy-750 bg-white dark:bg-navy-900 px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  const target = document.getElementById(item.id);
                  if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                    setActiveSection(item.id);
                  }
                  setMobileMenuOpen(false);
                }}
                className={`block px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-ocean-50 dark:bg-navy-800 text-ocean-600 dark:text-ocean-400 font-semibold border-l-4 border-ocean-600'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800'
                }`}
              >
                {item.label}
              </a>
            );
          })}
          <Link
            to="/unlock"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              isUnlockActive
                ? 'bg-ocean-50 dark:bg-navy-800 text-ocean-600 dark:text-ocean-400 font-semibold border-l-4 border-ocean-600'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800'
            }`}
          >
            Unlock Workspace
          </Link>
          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/get-started');
              }}
            >
              Get Started
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}


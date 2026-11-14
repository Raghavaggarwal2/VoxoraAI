import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  History,
  Bookmark,
  FolderKanban,
  Settings,
  Lock,
  Sun,
  Moon,
  Menu,
  X,
  ChevronDown,
  FolderLock,
  ArrowRight,
  Shield,
  Check,
} from 'lucide-react';
import Logo from '../components/common/Logo';
import { useWorkspace } from '../context/WorkspaceContext';
import { useTheme } from '../context/ThemeContext';
import PasswordChangeModal from '../components/workspace/PasswordChangeModal';

/**
 * Coastal Navy Authenticated Layout matching Screen 5 from the design specification.
 * Features a persistent deep-navy sidebar, responsive mobile drawer, workspace switcher,
 * active route highlighting, and workspace lock controls.
 */
export default function AuthenticatedLayout() {
  const {
    activeWorkspace,
    availableWorkspaces,
    lockWorkspace,
    unlockWorkspace,
  } = useWorkspace();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [workspaceSwitcherOpen, setWorkspaceSwitcherOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const switcherRef = useRef(null);

  // Close workspace switcher when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (switcherRef.current && !switcherRef.current.contains(event.target)) {
        setWorkspaceSwitcherOpen(false);
      }
    }
    if (workspaceSwitcherOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [workspaceSwitcherOpen]);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'New Analysis', path: '/new-analysis', icon: PlusCircle },
    { label: 'History', path: '/history', icon: History },
    { label: 'Saved', path: '/saved', icon: Bookmark },
    { label: 'Collections', path: '/collections', icon: FolderKanban },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const isItemActive = (path) => {
    const current = location.pathname;
    if (path === '/dashboard') {
      return current === '/dashboard' || current === '/app';
    }
    if (path === '/history') {
      return current === '/history' || current.startsWith('/workspace');
    }
    if (path === '/collections') {
      return current.startsWith('/collections');
    }
    return current === path;
  };

  const handleLock = () => {
    lockWorkspace();
    navigate('/unlock');
  };

  const displayName = activeWorkspace?.displayName || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50 dark:bg-navy-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-150">
      {/* ── Desktop Deep-Navy Sidebar ────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 h-full bg-navy-900 dark:bg-navy-950 border-r border-navy-800 text-slate-300 select-none shrink-0 z-30">
        {/* Brand header */}
        <div className="h-16 flex items-center px-6 border-b border-navy-800/80 shrink-0">
          <Logo size="md" to="/dashboard" inverted />
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto min-h-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all duration-150 group ${
                  active
                    ? 'bg-ocean-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-navy-850 font-medium'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer: Active Workspace & Lock */}
        <div className="p-3 border-t border-navy-800/80 space-y-2 shrink-0 mt-auto">
          {/* Workspace Switcher / Badge */}
          <div className="relative" ref={switcherRef}>
            <button
              type="button"
              onClick={() => setWorkspaceSwitcherOpen((prev) => !prev)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-navy-850 hover:bg-navy-800 border border-navy-750 hover:border-navy-650 text-left transition-all shadow-xs group"
              title="Switch Workspace"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-ocean-600/20 text-ocean-400 flex items-center justify-center shrink-0 border border-ocean-500/30 group-hover:bg-ocean-600/30 transition-colors">
                  <FolderLock className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-white truncate group-hover:text-ocean-300 transition-colors">
                    {activeWorkspace?.workspaceName || 'My Workspace'}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    Local Encrypted
                  </p>
                </div>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 shrink-0 ml-1 transition-transform duration-200 ${
                  workspaceSwitcherOpen ? 'rotate-180 text-ocean-400' : ''
                }`}
              />
            </button>

            {/* Switcher Dropdown Menu */}
            {workspaceSwitcherOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 p-2 bg-navy-850 border border-navy-700 rounded-2xl shadow-2xl z-50 space-y-1.5 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
                <div className="px-2 py-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-navy-750 pb-1.5">
                  <span>Local Workspaces</span>
                  <span className="text-ocean-400 font-mono text-[10px] bg-ocean-950/60 px-1.5 py-0.5 rounded border border-ocean-800/60">
                    {availableWorkspaces.length}
                  </span>
                </div>
                <div className="max-h-52 overflow-y-auto space-y-1 pr-0.5">
                  {availableWorkspaces.map((ws) => {
                    const isActive = ws.id === activeWorkspace?.id;
                    return (
                      <button
                        key={ws.id}
                        type="button"
                        onClick={() => {
                          setWorkspaceSwitcherOpen(false);
                          if (!isActive) {
                            lockWorkspace();
                            navigate('/unlock');
                          }
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-left transition-all ${
                          isActive
                            ? 'bg-ocean-600/20 border border-ocean-500/40 text-ocean-300 font-semibold shadow-xs'
                            : 'text-slate-300 hover:bg-navy-800 hover:text-white border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FolderLock className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-ocean-400' : 'text-slate-400'}`} />
                          <span className="truncate">{ws.workspaceName}</span>
                        </div>
                        {isActive ? (
                          <Check className="w-3.5 h-3.5 text-ocean-400 shrink-0" />
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(ws.createdAt).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Lock Workspace Action */}
          <button
            type="button"
            onClick={handleLock}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock Workspace</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-white dark:bg-navy-850 border-b border-slate-200 dark:border-navy-750 px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 z-20 shadow-xs">
          {/* Mobile hamburger */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Logo size="sm" to="/dashboard" />
          </div>

          <div className="hidden md:flex items-center gap-2.5">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-ocean-50 dark:bg-navy-800 text-ocean-600 dark:text-ocean-400 border border-ocean-100 dark:border-navy-700">
              {activeWorkspace?.workspaceName}
            </span>
            <span className="text-slate-300 dark:text-navy-700 text-xs">/</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {navItems.find((item) => isItemActive(item.path))?.label || 'Workspace'}
            </span>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
              title="Toggle color theme"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Quick Lock */}
            <button
              type="button"
              onClick={handleLock}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors border border-slate-200 dark:border-navy-700"
              title="Lock Workspace"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock</span>
            </button>

            {/* User Profile Initial Avatar - clicks to open Settings */}
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="w-8 h-8 rounded-full bg-ocean-600 hover:bg-ocean-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center select-none shadow-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-ocean-400 focus:ring-offset-2 dark:focus:ring-offset-navy-850 cursor-pointer"
              title={`Settings (${displayName})`}
              aria-label="Open Settings"
            >
              {initial}
            </button>
          </div>
        </header>

        {/* Main Routed Page Content (Scrollable) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl w-full mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ── Mobile Drawer ────────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 h-full bg-navy-900 border-r border-navy-800 flex flex-col justify-between p-4 z-10 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-navy-800">
                <Logo size="md" to="/dashboard" inverted />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="py-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item.path);

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors ${
                        active
                          ? 'bg-ocean-600 text-white shadow-sm font-semibold'
                          : 'text-slate-400 hover:text-white hover:bg-navy-850 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {active && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-navy-800 space-y-2">
              <div className="px-3 py-2 rounded-lg bg-navy-850 text-xs text-slate-300">
                <p className="font-semibold text-white truncate">{activeWorkspace?.workspaceName}</p>
                <p className="text-[10px] text-slate-400">Local Encrypted</p>
              </div>
              <button
                type="button"
                onClick={handleLock}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/20"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Workspace</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
    </div>
  );
}


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  FolderLock,
  Shield,
  HardDrive,
  Moon,
  Sun,
  Laptop,
  Download,
  Upload,
  Key,
  Lock,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useTheme } from '../context/ThemeContext';
import { storageService } from '../database/storage.service';
import { workspaceRepository } from '../database/workspace.repository';
import Button from '../components/common/Button';
import FormField from '../components/common/FormField';
import Input from '../components/common/Input';
import PasswordChangeModal from '../components/workspace/PasswordChangeModal';

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 MB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Screen 12 — Settings Page
 * Manages workspace details, security, appearance, storage usage, and backup/restore.
 */
export default function SettingsPage() {
  const navigate = useNavigate();
  const {
    activeWorkspace,
    lockWorkspace,
    exportCurrentWorkspace,
    importWorkspaceFile,
    refreshWorkspaces,
    settings,
  } = useWorkspace();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('workspace'); // 'workspace' | 'appearance' | 'storage' | 'security' | 'backup'
  const [workspaceName, setWorkspaceName] = useState(activeWorkspace?.workspaceName || '');
  const [displayName, setDisplayName] = useState(activeWorkspace?.displayName || '');
  const [email, setEmail] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [storageStats, setStorageStats] = useState({ usage: 0, quota: 0, percentUsed: 0 });

  useEffect(() => {
    if (activeWorkspace) {
      setWorkspaceName(activeWorkspace.workspaceName || '');
      setDisplayName(activeWorkspace.displayName || '');
    }
  }, [activeWorkspace]);

  useEffect(() => {
    const loadStorage = async () => {
      const stats = await storageService.getStorageQuota();
      setStorageStats(stats);
    };
    loadStorage();
  }, []);

  const handleCopyId = () => {
    if (activeWorkspace?.id) {
      navigator.clipboard.writeText(activeWorkspace.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!activeWorkspace?.id) return;

    try {
      await workspaceRepository.updateWorkspace(activeWorkspace.id, {
        workspaceName: workspaceName.trim(),
        displayName: displayName.trim(),
      });
      await refreshWorkspaces();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      alert(`Failed to update workspace: ${err.message}`);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportCurrentWorkspace();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanName = (activeWorkspace?.workspaceName || 'workspace')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_');
      link.download = `${cleanName}_backup.voxora`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    }
  };

  const tabs = [
    { id: 'workspace', label: 'Workspace Details', icon: FolderLock },
    { id: 'appearance', label: 'Appearance', icon: Sun },
    { id: 'storage', label: 'Storage & Privacy', icon: HardDrive },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'backup', label: 'Backup & Restore', icon: Download },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-display">
          Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your local workspace, security credentials, preferences, and data backups.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* ── Sub-navigation Tabs (Screen 12 Left Menu) ─────────── */}
        <div className="md:col-span-4 bg-white dark:bg-navy-850 rounded-2xl border border-slate-200 dark:border-navy-750 p-2 space-y-1 shadow-sm">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-ocean-50 dark:bg-navy-800 text-ocean-600 dark:text-ocean-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-navy-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-ocean-600 dark:text-ocean-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Tab Content Area ───────────────────────────────────── */}
        <div className="md:col-span-8 bg-white dark:bg-navy-850 rounded-2xl border border-slate-200 dark:border-navy-750 p-6 sm:p-8 shadow-sm">
          {/* TAB 1: Workspace Details */}
          {activeTab === 'workspace' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 dark:border-navy-800 pb-4">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Workspace Information
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Metadata identifying this local workspace.
                </p>
              </div>

              {saveSuccess && (
                <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Workspace details successfully updated!</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <FormField label="Workspace Name" id="ws-name" required>
                  <Input
                    id="ws-name"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                  />
                </FormField>

                <FormField label="Display Name" id="display-name" required>
                  <Input
                    id="display-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </FormField>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Workspace Identifier (UUID)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={activeWorkspace?.id || ''}
                      className="w-full bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg text-xs font-mono p-2.5 text-slate-600 dark:text-slate-300 outline-none"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyId}
                      leftIcon={copiedId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    >
                      {copiedId ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                </div>

                <div className="pt-2 text-xs text-slate-400">
                  Created On: {new Date(activeWorkspace?.createdAt).toLocaleDateString()}
                </div>

                <div className="pt-2 flex justify-end">
                  <Button type="submit" variant="primary" size="md">
                    Save Details
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: Appearance */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 dark:border-navy-800 pb-4">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Appearance &amp; Theme
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Choose how Voxora AI looks on this device.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    theme === 'dark'
                      ? 'border-ocean-600 bg-ocean-50/20 dark:bg-navy-800 shadow-sm'
                      : 'border-slate-200 dark:border-navy-700 hover:border-slate-300'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-navy-900 text-white flex items-center justify-center mb-3">
                    <Moon className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Coastal Navy</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Deep navy background for reduced eye strain
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    theme === 'light'
                      ? 'border-ocean-600 bg-ocean-50/50 shadow-sm'
                      : 'border-slate-200 dark:border-navy-700 hover:border-slate-300'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center mb-3">
                    <Sun className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Light Mode</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    High contrast clean white surfaces
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Storage & Privacy */}
          {activeTab === 'storage' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 dark:border-navy-800 pb-4">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Local Storage &amp; Privacy
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Origin Private File System (OPFS) and IndexedDB metrics.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-900 space-y-3">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-semibold text-slate-900 dark:text-white">Device Storage Used</span>
                  <span className="font-mono text-ocean-600 dark:text-ocean-400 font-bold">
                    {formatBytes(storageStats.usage)}
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-navy-800 overflow-hidden">
                  <div
                    className="h-full bg-ocean-600 rounded-full transition-all"
                    style={{ width: `${Math.min(storageStats.percentUsed, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Usage: {storageStats.percentUsed}%</span>
                  <span>Estimated Quota: {formatBytes(storageStats.quota)}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-200 space-y-1.5 leading-relaxed">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Important Privacy Notice</span>
                </div>
                <p>
                  All analyses, transcripts, and media files are stored locally in your browser's sandboxed storage. Clearing your browser cache or site data will permanently erase your workspace unless you have an exported <code>.voxora</code> backup.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: Security */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 dark:border-navy-800 pb-4">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Security Controls
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Envelope encryption and password credentials.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Change Workspace Password
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Rewraps your 256-bit master key with a newly derived password KEK.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPasswordModalOpen(true)}
                    leftIcon={<Key className="w-3.5 h-3.5" />}
                  >
                    Change
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Lock Current Workspace
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Immediately scrubs in-memory master keys and returns to unlock screen.
                    </p>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      lockWorkspace();
                      navigate('/unlock');
                    }}
                    leftIcon={<Lock className="w-3.5 h-3.5" />}
                  >
                    Lock Now
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Backup & Restore */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 dark:border-navy-800 pb-4">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Encrypted Backup &amp; Restore
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Export complete workspace archive (.voxora) or restore an existing backup.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-5 rounded-2xl border border-ocean-200 dark:border-navy-700 bg-ocean-50/30 dark:bg-navy-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Export Encrypted Backup
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
                      Packages all encrypted analyses, collections, metadata, and OPFS media into a portable <code>.voxora</code> archive. Plaintext passwords or keys are never included.
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleExport}
                    leftIcon={<Download className="w-4 h-4" />}
                  >
                    Export Backup
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
    </div>
  );
}


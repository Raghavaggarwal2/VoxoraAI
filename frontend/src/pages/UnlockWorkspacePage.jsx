import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Lock,
  ArrowRight,
  Shield,
  KeyRound,
  ChevronDown,
  ArrowLeft,
  CheckCircle2,
  FolderLock,
  AlertCircle,
  PlusCircle,
  UploadCloud,
} from 'lucide-react';
import Logo from '../components/common/Logo';
import FormField from '../components/common/FormField';
import PasswordInput from '../components/common/PasswordInput';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Select from '../components/common/Select';
import { useWorkspace } from '../context/WorkspaceContext';

/**
 * Screen 4 — Unlock Workspace (Returning Visit)
 * Enables returning users to select their local workspace and unlock it with their password or recovery key.
 */
export default function UnlockWorkspacePage() {
  const navigate = useNavigate();
  const {
    availableWorkspaces,
    unlockWorkspace,
    unlockWithRecoveryKey,
    isUnlocked,
    activeWorkspace,
  } = useWorkspace();

  // State management
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [useRecoveryKey, setUseRecoveryKey] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect to dashboard if already unlocked with an active 24-hour session
  useEffect(() => {
    if (isUnlocked && activeWorkspace) {
      navigate('/dashboard', { replace: true });
    }
  }, [isUnlocked, activeWorkspace, navigate]);

  // Initialize selected workspace from remembered storage or first available
  useEffect(() => {
    if (availableWorkspaces && availableWorkspaces.length > 0) {
      const rememberedId = localStorage.getItem('voxora_last_workspace_id');
      const exists = availableWorkspaces.find((ws) => ws.id === rememberedId);
      if (exists) {
        setSelectedWorkspaceId(exists.id);
        setRememberDevice(true);
      } else {
        setSelectedWorkspaceId(availableWorkspaces[0].id);
      }
    }
  }, [availableWorkspaces]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedWorkspaceId) {
      setError('Please select a workspace to unlock.');
      return;
    }

    if (useRecoveryKey) {
      if (!recoveryKey.trim()) {
        setError('Please enter your 24-word recovery phrase');
        return;
      }
    } else {
      if (!password) {
        setError('Please enter your workspace password');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (useRecoveryKey) {
        await unlockWithRecoveryKey(selectedWorkspaceId, recoveryKey.trim());
      } else {
        await unlockWorkspace(selectedWorkspaceId, password, rememberDevice);
      }
      // On success, navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Incorrect password or corrupted key envelope.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedWorkspace = availableWorkspaces.find((ws) => ws.id === selectedWorkspaceId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-900 text-slate-900 dark:text-slate-100 font-sans flex flex-col justify-between p-4 sm:p-6 transition-colors duration-150">
      {/* Top Navigation */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between py-2">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <Logo size="sm" showText={false} />
      </div>

      {/* Main Unlock Card (Matching Screen 4 Reference) */}
      <main className="w-full max-w-lg mx-auto my-auto py-8">
        <div className="text-center space-y-3 mb-8">
          <div className="flex justify-center mb-3">
            <Logo size="lg" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-display">
            Unlock Your Workspace
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Enter your password to access your private analyses.
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white dark:bg-navy-850 border border-slate-200 dark:border-navy-700 rounded-2xl p-6 sm:p-8 shadow-sm relative">
          {availableWorkspaces.length === 0 ? (
            /* Empty State: No local workspaces found */
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-ocean-50 dark:bg-navy-800 text-ocean-600 dark:text-ocean-400 flex items-center justify-center mx-auto border border-ocean-100 dark:border-navy-700">
                <FolderLock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  No Local Workspaces Found
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  No encrypted workspaces are stored on this device. Create a new workspace or import a backup file.
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate('/create-workspace')}
                  leftIcon={<PlusCircle className="w-4 h-4" />}
                >
                  Create Workspace
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => navigate('/get-started')}
                  leftIcon={<UploadCloud className="w-4 h-4" />}
                >
                  Import Backup
                </Button>
              </div>
            </div>
          ) : (
            /* Standard Unlock Form */
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {error && (
                <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Workspace Selector */}
              <FormField label="Workspace" id="workspace-select">
                <Select
                  id="workspace-select"
                  value={selectedWorkspaceId}
                  onChange={(e) => {
                    setSelectedWorkspaceId(e.target.value);
                    setError('');
                  }}
                  icon={<FolderLock className="w-4 h-4" />}
                >
                  {availableWorkspaces.map((ws) => (
                    <option
                      key={ws.id}
                      value={ws.id}
                      className="bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-100 py-1"
                    >
                      {ws.workspaceName} ({new Date(ws.createdAt).toLocaleDateString()})
                    </option>
                  ))}
                </Select>
              </FormField>

              {/* Password or Recovery Key field */}
              {!useRecoveryKey ? (
                <FormField
                  label="Password"
                  id="unlock-password"
                  required
                >
                  <PasswordInput
                    id="unlock-password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    error={Boolean(error)}
                    autoFocus
                  />
                </FormField>
              ) : (
                <FormField
                  label="24-Word Recovery Phrase"
                  id="recovery-key"
                  required
                  helperText="Enter the 24 words in order separated by spaces."
                >
                  <Input
                    id="recovery-key"
                    placeholder="word1 word2 word3 ... word24"
                    value={recoveryKey}
                    onChange={(e) => {
                      setRecoveryKey(e.target.value);
                      if (error) setError('');
                    }}
                    error={Boolean(error)}
                    leftIcon={<KeyRound className="w-4 h-4" />}
                    autoFocus
                  />
                </FormField>
              )}

              {/* "Remember on this device" Checkbox */}
              {!useRecoveryKey && (
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={rememberDevice}
                      onChange={(e) => setRememberDevice(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 dark:border-navy-700 text-ocean-600 focus:ring-ocean-500"
                    />
                    <span>Remember selected workspace on this device</span>
                  </label>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full text-base"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {isLoading ? 'Unwrapping Master Key...' : 'Unlock Workspace'}
              </Button>

              {/* Recovery key & alternative toggles */}
              <div className="pt-2 text-center space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setUseRecoveryKey((prev) => !prev);
                    setError('');
                  }}
                  className="text-xs sm:text-sm text-ocean-600 dark:text-ocean-400 hover:text-ocean-700 dark:hover:text-ocean-300 font-medium inline-flex items-center gap-1 transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  {useRecoveryKey ? 'Use standard password' : 'Use Recovery Key'}
                </button>

                <div className="flex items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-navy-750">
                  <Link
                    to="/create-workspace"
                    className="hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors"
                  >
                    Create new workspace
                  </Link>
                  <span>&bull;</span>
                  <Link
                    to="/get-started"
                    className="hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors"
                  >
                    Import backup
                  </Link>
                </div>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Footer info */}
      <div className="w-full max-w-4xl mx-auto py-3 text-center text-xs text-slate-400 dark:text-slate-500">
        Voxora AI &bull; Encrypted local workspace security
      </div>
    </div>
  );
}

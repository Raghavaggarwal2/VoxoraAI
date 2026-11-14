import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { workspaceService } from '../database/workspace.service';
import { backupService } from '../database/backup.service';
import { keyManagementService } from '../database/key-management.service';

const WorkspaceContext = createContext(null);

const DEFAULT_INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export function WorkspaceProvider({ children }) {
  const [availableWorkspaces, setAvailableWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState(null);

  const inactivityTimerRef = useRef(null);

  // ── Workspace Discovery ───────────────────────────────────────────────────

  const refreshWorkspaces = useCallback(async () => {
    try {
      const list = await workspaceService.listWorkspaces();
      setAvailableWorkspaces(list);
      return list;
    } catch (err) {
      console.error('Failed to load workspaces:', err);
      setAvailableWorkspaces([]);
      return [];
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        await refreshWorkspaces();
        // Restore active workspace session if within the 24-hour validity window
        const restored = await workspaceService.restoreSession();
        if (restored) {
          setActiveWorkspace(restored.workspace);
          setSettings(restored.settings);
          setIsUnlocked(true);
        }
      } catch (err) {
        console.error('Failed to initialize or restore workspace session:', err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [refreshWorkspaces]);

  // ── Inactivity Auto-Lock ──────────────────────────────────────────────────

  const lockWorkspace = useCallback(() => {
    workspaceService.lockWorkspace();
    setActiveWorkspace(null);
    setIsUnlocked(false);
    setSettings(null);
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (isUnlocked) {
      // Default auto-lock timeout to 24 hours (1440 minutes)
      const timeoutMs = (settings?.autoLockMinutes || 24 * 60) * 60 * 1000;
      inactivityTimerRef.current = setTimeout(() => {
        console.warn('Workspace session expired after 24 hours of inactivity.');
        lockWorkspace();
      }, timeoutMs);
    }
  }, [isUnlocked, settings?.autoLockMinutes, lockWorkspace]);

  useEffect(() => {
    if (!isUnlocked) return;

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    const handleUserActivity = () => {
      resetInactivityTimer();
    };

    // Separate visibility changes: switching tabs/windows never locks the workspace.
    // When returning to the tab, immediately refresh activity timer.
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resetInactivityTimer();
      }
    };

    events.forEach((ev) => window.addEventListener(ev, handleUserActivity, { passive: true }));
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleUserActivity);
    resetInactivityTimer();

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleUserActivity));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleUserActivity);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [isUnlocked, resetInactivityTimer]);

  // ── Operations ────────────────────────────────────────────────────────────

  const createWorkspace = async ({ workspaceName, displayName, email, password }) => {
    setIsLoading(true);
    try {
      const result = await workspaceService.createWorkspace({
        workspaceName,
        displayName,
        email,
        password,
      });

      await refreshWorkspaces();
      setActiveWorkspace(result.workspace);
      setIsUnlocked(true);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const unlockWorkspace = async (workspaceId, password, remember = false) => {
    setIsLoading(true);
    try {
      const result = await workspaceService.unlockWithPassword(workspaceId, password);
      setActiveWorkspace(result.workspace);
      setSettings(result.settings);
      setIsUnlocked(true);

      if (remember) {
        try {
          localStorage.setItem('voxora_last_workspace_id', workspaceId);
        } catch {}
      } else {
        try {
          localStorage.removeItem('voxora_last_workspace_id');
        } catch {}
      }

      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const unlockWithRecoveryKey = async (workspaceId, recoveryKey) => {
    setIsLoading(true);
    try {
      const result = await workspaceService.unlockWithRecoveryKey(workspaceId, recoveryKey);
      setActiveWorkspace(result.workspace);
      setSettings(result.settings);
      setIsUnlocked(true);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    if (!activeWorkspace || !isUnlocked) {
      throw new Error('No active unlocked workspace.');
    }
    return workspaceService.changePassword(activeWorkspace.id, currentPassword, newPassword);
  };

  const exportCurrentWorkspace = async () => {
    if (!activeWorkspace) {
      throw new Error('No active workspace selected for export.');
    }
    return backupService.exportWorkspace(activeWorkspace.id);
  };

  const importWorkspaceFile = async (file, options) => {
    setIsLoading(true);
    try {
      const result = await backupService.importWorkspace(file, options);
      await refreshWorkspaces();
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    availableWorkspaces,
    activeWorkspace,
    isUnlocked,
    isLoading,
    settings,
    createWorkspace,
    unlockWorkspace,
    unlockWithRecoveryKey,
    lockWorkspace,
    changePassword,
    refreshWorkspaces,
    exportCurrentWorkspace,
    importWorkspaceFile,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}


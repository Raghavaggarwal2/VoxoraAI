import { bufferToBase64, base64ToBuffer } from './encryption.service';

const SESSION_STORAGE_KEY = 'voxora_active_session';
export const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Universal Storage Provider with in-memory fallback for test environments.
 */
export function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (
    typeof globalThis !== 'undefined' &&
    globalThis.localStorage &&
    typeof globalThis.localStorage.setItem === 'function'
  ) {
    return globalThis.localStorage;
  }
  if (!globalThis.__voxoraMemoryStorage) {
    const store = new Map();
    globalThis.__voxoraMemoryStorage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
    };
  }
  return globalThis.__voxoraMemoryStorage;
}

/**
 * 24-Hour Workspace Session Management Service.
 * Preserves the unlocked workspace state across page refreshes and browser reloads
 * for up to 24 hours without repeatedly asking for passwords.
 */
export const sessionService = {
  /**
   * Persists an unlocked workspace session for up to 24 hours.
   */
  saveSession(workspaceId, rawMasterKeyBytes, durationMs = SESSION_DURATION_MS) {
    if (!workspaceId || !rawMasterKeyBytes) return;

    try {
      const storage = getStorage();
      const payload = {
        workspaceId,
        masterKeyBase64: bufferToBase64(rawMasterKeyBytes),
        unlockedAt: Date.now(),
        expiresAt: Date.now() + durationMs,
      };
      storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      console.warn('Could not persist session to localStorage:', err);
    }
  },

  /**
   * Retrieves the active session if within the valid 24-hour expiration window.
   */
  getSession() {
    try {
      const storage = getStorage();
      const raw = storage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return null;

      const data = JSON.parse(raw);
      if (!data || !data.workspaceId || !data.masterKeyBase64 || !data.expiresAt) {
        this.clearSession();
        return null;
      }

      // Check if session has expired (after 24 hours)
      if (Date.now() > data.expiresAt) {
        this.clearSession();
        return null;
      }

      return data;
    } catch (err) {
      this.clearSession();
      return null;
    }
  },

  /**
   * Explicitly clears the active session on lock or sign-out.
   */
  clearSession() {
    try {
      const storage = getStorage();
      storage.removeItem(SESSION_STORAGE_KEY);
    } catch (err) {
      console.warn('Could not clear session from localStorage:', err);
    }
  },
};


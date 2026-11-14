import { wipeBytes } from './encryption.service';

/**
 * In-Memory Key Management Service.
 * Holds the unlocked master key in ephemeral memory only.
 * 
 * Security Properties:
 * - Master key is NEVER stored in localStorage, sessionStorage, or IndexedDB in plaintext.
 * - On workspace lock, all in-memory references are cleared and raw buffers wiped.
 * - Note: JS garbage collection does not guarantee low-level OS RAM wiping, but no persistent
 *   material remains once locked.
 */
class KeyManagementService {
  constructor() {
    this._activeMasterKey = null;
    this._activeWorkspaceId = null;
    this._rawKeyBytes = null;
  }

  /**
   * Sets the unlocked master key in memory.
   */
  setMasterKey(workspaceId, cryptoKey, rawBytes = null) {
    this._activeWorkspaceId = workspaceId;
    this._activeMasterKey = cryptoKey;
    if (rawBytes) {
      this._rawKeyBytes = new Uint8Array(rawBytes);
    }
  }

  /**
   * Returns the active master CryptoKey.
   */
  getMasterKey() {
    return this._activeMasterKey;
  }

  /**
   * Returns the active workspace ID if unlocked.
   */
  getActiveWorkspaceId() {
    return this._activeWorkspaceId;
  }

  /**
   * Returns whether a workspace is currently unlocked in memory.
   */
  isUnlocked(workspaceId = null) {
    if (!this._activeMasterKey || !this._activeWorkspaceId) return false;
    if (workspaceId) {
      return this._activeWorkspaceId === workspaceId;
    }
    return true;
  }

  /**
   * Gets the raw key bytes if needed for rewrapping (e.g. password change).
   */
  getRawKeyBytes() {
    return this._rawKeyBytes;
  }

  /**
   * Clears the in-memory keys and wipes temporary buffers.
   */
  clear() {
    if (this._rawKeyBytes) {
      wipeBytes(this._rawKeyBytes);
      this._rawKeyBytes = null;
    }
    this._activeMasterKey = null;
    this._activeWorkspaceId = null;
  }
}

export const keyManagementService = new KeyManagementService();


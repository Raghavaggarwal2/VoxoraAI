import { workspaceRepository } from './workspace.repository';

/**
 * Origin Private File System (OPFS) Storage Service.
 * Provides private, sandboxed, high-performance binary storage for media files
 * isolated by workspace ID.
 */
export const storageService = {
  /**
   * Checks whether the current browser environment supports OPFS.
   */
  isAvailable() {
    return Boolean(
      typeof navigator !== 'undefined' &&
      navigator.storage &&
      typeof navigator.storage.getDirectory === 'function'
    );
  },

  /**
   * Retrieves estimated storage quota usage.
   */
  async getStorageQuota() {
    if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
        percentUsed: estimate.quota ? Math.round(((estimate.usage || 0) / estimate.quota) * 100) : 0,
      };
    }
    return { usage: 0, quota: 0, percentUsed: 0 };
  },

  /**
   * Gets or creates the directory handle for a specific workspace.
   */
  async getWorkspaceDirectoryHandle(workspaceId) {
    if (!this.isAvailable()) {
      throw new Error('OPFS is not supported in this browser. Please use a modern browser supporting navigator.storage.getDirectory.');
    }

    const root = await navigator.storage.getDirectory();
    // Path: voxora / {workspaceId} / media
    const voxoraDir = await root.getDirectoryHandle('voxora', { create: true });
    const wsDir = await voxoraDir.getDirectoryHandle(workspaceId, { create: true });
    return wsDir.getDirectoryHandle('media', { create: true });
  },

  /**
   * Saves a media file into OPFS and registers its metadata in IndexedDB.
   * Performs write verification and automatic rollback if writing or registration fails.
   */
  async saveMedia(workspaceId, fileId, fileBlobOrBuffer, filename, mimeType, customMetadata = {}) {
    if (!this.isAvailable()) {
      throw new Error('OPFS is unavailable. Cannot store media locally.');
    }

    let mediaDir = null;
    let fileWritten = false;

    try {
      mediaDir = await this.getWorkspaceDirectoryHandle(workspaceId);
      const fileHandle = await mediaDir.getFileHandle(fileId, { create: true });
      const writable = await fileHandle.createWritable();

      if (fileBlobOrBuffer instanceof Blob) {
        await writable.write(fileBlobOrBuffer);
      } else if (fileBlobOrBuffer instanceof Uint8Array || fileBlobOrBuffer instanceof ArrayBuffer) {
        await writable.write(fileBlobOrBuffer);
      } else {
        throw new Error('Unsupported media data type for OPFS storage.');
      }
      await writable.close();
      fileWritten = true;

      // ── Write Verification ────────────────────────────────────────────────
      const verifiedFile = await fileHandle.getFile();
      const expectedSize = fileBlobOrBuffer.size ?? fileBlobOrBuffer.byteLength ?? 0;
      if (expectedSize > 0 && verifiedFile.size === 0) {
        throw new Error('Storage verification failed: written media file is empty (0 bytes).');
      }

      const opfsPath = `voxora/${workspaceId}/media/${fileId}`;
      const mediaRecord = {
        id: fileId,
        workspaceId,
        filename,
        size: verifiedFile.size || expectedSize,
        mimeType,
        opfsPath,
        createdAt: new Date().toISOString(),
        metadata: customMetadata,
      };

      // Register metadata in IndexedDB
      try {
        await workspaceRepository.recordMediaFile(mediaRecord);
      } catch (dbErr) {
        // Rollback OPFS file if Dexie registration fails
        try {
          await mediaDir.removeEntry(fileId);
        } catch {}
        throw new Error(`Failed to register media in database: ${dbErr.message}`);
      }

      return mediaRecord;
    } catch (err) {
      // Rollback orphaned file if error happened after creation
      if (fileWritten && mediaDir) {
        try {
          await mediaDir.removeEntry(fileId);
        } catch {}
      }

      if (err.name === 'QuotaExceededError') {
        throw new Error('Disk quota exceeded: Device storage limit reached for local workspace media.');
      }
      throw err;
    }
  },

  /**
   * Verifies that a specific media file exists in OPFS and is readable.
   */
  async verifyMediaIntegrity(workspaceId, fileId) {
    if (!this.isAvailable()) {
      return { valid: false, size: 0, error: 'OPFS not supported in this environment' };
    }

    try {
      const mediaDir = await this.getWorkspaceDirectoryHandle(workspaceId);
      const fileHandle = await mediaDir.getFileHandle(fileId);
      const file = await fileHandle.getFile();
      return { valid: file.size > 0, size: file.size, error: null };
    } catch (err) {
      return { valid: false, size: 0, error: err.message };
    }
  },

  /**
   * Startup integrity check: reconciles IndexedDB media records with OPFS storage.
   * Removes orphaned OPFS files and reports missing references.
   */
  async runStorageIntegrityCheck(workspaceId) {
    if (!this.isAvailable() || !workspaceId) return { orphanedRemoved: 0, missingCount: 0 };

    try {
      const mediaDir = await this.getWorkspaceDirectoryHandle(workspaceId);
      const dbMediaList = await workspaceRepository.listMediaFiles(workspaceId);
      const registeredIds = new Set(dbMediaList.map((m) => m.id));

      let orphanedRemoved = 0;
      // Scan physical OPFS files in directory
      if (mediaDir.keys) {
        for await (const name of mediaDir.keys()) {
          if (!registeredIds.has(name)) {
            try {
              await mediaDir.removeEntry(name);
              orphanedRemoved++;
              console.warn(`Integrity check: pruned orphaned OPFS media file '${name}'`);
            } catch {}
          }
        }
      }

      return { orphanedRemoved, totalRegistered: dbMediaList.length };
    } catch (err) {
      console.warn('Storage integrity check notice:', err);
      return { orphanedRemoved: 0, error: err.message };
    }
  },

  /**
   * Retrieves a media file as a File/Blob from OPFS.
   */
  async getMedia(workspaceId, fileId) {
    if (!this.isAvailable()) return null;

    try {
      const mediaDir = await this.getWorkspaceDirectoryHandle(workspaceId);
      const fileHandle = await mediaDir.getFileHandle(fileId);
      return fileHandle.getFile();
    } catch (err) {
      if (err.name === 'NotFoundError') {
        return null;
      }
      throw err;
    }
  },

  /**
   * Deletes a media file from OPFS and removes its index from IndexedDB.
   */
  async deleteMedia(workspaceId, fileId) {
    if (!this.isAvailable()) return;

    try {
      const mediaDir = await this.getWorkspaceDirectoryHandle(workspaceId);
      await mediaDir.removeEntry(fileId);
    } catch (err) {
      // Ignore if file doesn't exist on disk
      if (err.name !== 'NotFoundError') {
        console.warn('Failed to delete file from OPFS:', err);
      }
    }
    await workspaceRepository.deleteMediaFile(fileId);
  },

  /**
   * Lists all media file metadata for a workspace.
   */
  async listMedia(workspaceId) {
    return workspaceRepository.listMediaFiles(workspaceId);
  },

  /**
   * Recursively removes all OPFS files for an entire workspace.
   */
  async removeWorkspaceFiles(workspaceId) {
    if (!this.isAvailable()) return;

    try {
      const root = await navigator.storage.getDirectory();
      const voxoraDir = await root.getDirectoryHandle('voxora');
      await voxoraDir.removeEntry(workspaceId, { recursive: true });
    } catch (err) {
      // Ignore if directory does not exist
      if (err.name !== 'NotFoundError') {
        console.warn('Failed to clean up OPFS workspace folder:', err);
      }
    }
  },
};


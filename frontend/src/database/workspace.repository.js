import { db } from './db';

/**
 * Repository layer isolating UI and services from raw IndexedDB/Dexie calls.
 */
export const workspaceRepository = {
  /**
   * Retrieves summary of all local workspaces for discovery and selector dropdowns.
   * Does NOT decrypt any sensitive payloads.
   */
  async getAllWorkspaces() {
    const list = await db.workspaces.toArray();
    return list.map((ws) => ({
      id: ws.id,
      workspaceName: ws.workspaceName,
      displayName: ws.displayName,
      createdAt: ws.createdAt,
      updatedAt: ws.updatedAt,
      schemaVersion: ws.schemaVersion,
    }));
  },

  /**
   * Retrieves full workspace envelope row by ID.
   */
  async getWorkspaceById(id) {
    return db.workspaces.get(id);
  },

  /**
   * Checks if a workspace with the given name already exists locally.
   */
  async findByName(workspaceName) {
    return db.workspaces
      .filter((ws) => ws.workspaceName.toLowerCase() === workspaceName.trim().toLowerCase())
      .first();
  },

  /**
   * Atomically saves workspace record and initial settings/metadata.
   */
  async createWorkspaceTransaction(workspaceRecord, settingsRecord, metadataRecord) {
    return db.transaction(
      'rw',
      [db.workspaces, db.workspaceSettings, db.workspaceMetadata],
      async () => {
        await db.workspaces.add(workspaceRecord);
        if (settingsRecord) {
          await db.workspaceSettings.add(settingsRecord);
        }
        if (metadataRecord) {
          await db.workspaceMetadata.add(metadataRecord);
        }
        return workspaceRecord;
      }
    );
  },

  /**
   * Updates workspace envelope or metadata (e.g. on password change).
   */
  async updateWorkspace(id, updates) {
    return db.workspaces.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * Retrieves encrypted settings for a workspace.
   */
  async getSettings(workspaceId) {
    return db.workspaceSettings.where('workspaceId').equals(workspaceId).first();
  },

  /**
   * Updates encrypted settings for a workspace.
   */
  async updateSettings(workspaceId, encryptedPayload) {
    const existing = await this.getSettings(workspaceId);
    const now = new Date().toISOString();
    if (existing) {
      return db.workspaceSettings.update(existing.id, {
        encryptedPayload,
        updatedAt: now,
      });
    } else {
      return db.workspaceSettings.add({
        id: crypto.randomUUID(),
        workspaceId,
        encryptedPayload,
        updatedAt: now,
      });
    }
  },

  /**
   * Retrieves encrypted metadata for a workspace.
   */
  async getMetadata(workspaceId) {
    return db.workspaceMetadata.where('workspaceId').equals(workspaceId).first();
  },

  /**
   * Deletes workspace and all associated records atomically.
   */
  async deleteWorkspace(id) {
    return db.transaction(
      'rw',
      [db.workspaces, db.workspaceSettings, db.workspaceMetadata, db.mediaFiles],
      async () => {
        await db.workspaces.delete(id);
        await db.workspaceSettings.where('workspaceId').equals(id).delete();
        await db.workspaceMetadata.where('workspaceId').equals(id).delete();
        await db.mediaFiles.where('workspaceId').equals(id).delete();
      }
    );
  },

  /**
   * Records media file metadata in IndexedDB.
   */
  async recordMediaFile(mediaRecord) {
    return db.mediaFiles.add(mediaRecord);
  },

  /**
   * Lists media records for a workspace.
   */
  async listMediaFiles(workspaceId) {
    return db.mediaFiles.where('workspaceId').equals(workspaceId).toArray();
  },

  /**
   * Deletes media record from IndexedDB.
   */
  async deleteMediaFile(fileId) {
    return db.mediaFiles.delete(fileId);
  },
};


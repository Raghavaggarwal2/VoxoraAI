import { db } from './db';
import { storageService } from './storage.service';
import { keyManagementService } from './key-management.service';
import { encryptData, decryptData } from './encryption.service';
import { api } from '../services/api';

/**
 * Data repository for local analyses, collections, and saved items.
 * Enforces strict workspace-scoping across all read and write queries.
 */
export const dataRepository = {
  // ── Analysis Operations ───────────────────────────────────────────────────

  /**
   * Creates a new local analysis record scoped to the active workspace.
   */
  async createAnalysis({
    workspaceId,
    title,
    description = '',
    mediaType = 'video',
    filename = '',
    fileSize = 0,
    duration = null,
    language = 'auto',
    mediaFileId = null,
    thumbnail = null,
    jobId = null,
    status = 'ready',
  }) {
    if (!workspaceId) {
      throw new Error('Workspace ID is required to create an analysis.');
    }
    if (!title || !title.trim()) {
      throw new Error('Analysis title is required.');
    }

    const now = new Date().toISOString();
    const analysisRecord = {
      id: crypto.randomUUID(),
      workspaceId,
      title: title.trim(),
      description: description.trim(),
      mediaType, // 'video' | 'audio'
      filename,
      fileSize,
      duration,
      language,
      mediaFileId,
      thumbnail,
      jobId, // Remote backend job ID if initiated
      status, // 'ready' | 'processing' | 'completed' | 'failed'
      isSaved: false,
      createdAt: now,
      updatedAt: now,
    };

    await db.analyses.add(analysisRecord);
    return analysisRecord;
  },

  /**
   * Retrieves analyses for a specific workspace with filtering, searching, and sorting.
   */
  async getAnalysesByWorkspace(workspaceId, options = {}) {
    if (!workspaceId) return [];

    const {
      search = '',
      mediaType = 'all',
      status = 'all',
      isSaved = null,
      sort = 'newest',
      limit = null,
    } = options;

    let query = db.analyses.where('workspaceId').equals(workspaceId);

    let list = await query.toArray();

    // 1. Text Search (title and description)
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q)) ||
          (item.filename && item.filename.toLowerCase().includes(q))
      );
    }

    // 2. Filter by Media Type
    if (mediaType && mediaType !== 'all') {
      list = list.filter((item) => item.mediaType === mediaType);
    }

    // 3. Filter by Status
    if (status && status !== 'all') {
      list = list.filter((item) => item.status === status);
    }

    // 4. Filter by Saved state
    if (typeof isSaved === 'boolean') {
      list = list.filter((item) => Boolean(item.isSaved) === isSaved);
    }

    // 5. Sorting
    list.sort((a, b) => {
      if (sort === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (sort === 'title-asc') {
        return a.title.localeCompare(b.title);
      }
      if (sort === 'title-desc') {
        return b.title.localeCompare(a.title);
      }
      // default: 'newest'
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    if (limit && limit > 0) {
      return list.slice(0, limit);
    }

    return list;
  },

  /**
   * Retrieves a single analysis record by ID or associated jobId, scoped to workspace.
   */
  async getAnalysisById(id, workspaceId) {
    if (!id || !workspaceId) return null;
    let record = await db.analyses.get(id);
    if (!record) {
      record = await db.analyses
        .where('workspaceId')
        .equals(workspaceId)
        .filter((a) => a.jobId === id)
        .first();
    }
    if (!record || record.workspaceId !== workspaceId) return null;
    return record;
  },

  /**
   * Updates an analysis record.
   */
  async updateAnalysis(id, workspaceId, updates) {
    const existing = await this.getAnalysisById(id, workspaceId);
    if (!existing) {
      throw new Error('Analysis record not found in this workspace.');
    }

    const safeUpdates = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    // Protect immutable identifiers
    delete safeUpdates.id;
    delete safeUpdates.workspaceId;
    delete safeUpdates.createdAt;

    await db.analyses.update(id, safeUpdates);
    return { ...existing, ...safeUpdates };
  },

  /**
   * Toggles the saved/bookmarked state of an analysis.
   */
  async toggleSaveAnalysis(id, workspaceId) {
    const existing = await this.getAnalysisById(id, workspaceId);
    if (!existing) {
      throw new Error('Analysis record not found in this workspace.');
    }

    const nextState = !existing.isSaved;
    await db.analyses.update(id, {
      isSaved: nextState,
      updatedAt: new Date().toISOString(),
    });
    return nextState;
  },

  /**
   * Atomically deletes an analysis record, its collection associations, its OPFS media file,
   * its encrypted results, its encrypted chat messages, and remote vector collections.
   */
  async deleteAnalysis(id, workspaceId) {
    const existing = await this.getAnalysisById(id, workspaceId);
    if (!existing) return;

    // Delete in atomic Dexie transaction
    await db.transaction(
      'rw',
      [db.analyses, db.analysisCollections, db.analysisResults, db.analysisChats],
      async () => {
        await db.analyses.delete(id);
        await db.analysisCollections
          .where('analysisId')
          .equals(id)
          .delete();
        await db.analysisResults.delete(id);
        await db.analysisChats
          .where('analysisId')
          .equals(id)
          .delete();
      }
    );

    // Delete associated OPFS media file if registered
    if (existing.mediaFileId) {
      try {
        await storageService.deleteMedia(workspaceId, existing.mediaFileId);
      } catch (err) {
        console.warn('Could not remove media from OPFS:', err);
      }
    }

    // Delete remote backend job vector collection if available
    const remoteJobId = existing.jobId || existing.id;
    if (remoteJobId) {
      try {
        await api.deleteJob(remoteJobId);
      } catch (err) {
        // Safe if backend is offline or job already deleted
      }
    }
  },

  // ── Encrypted Results & Intelligence Operations ────────────────────────────

  /**
   * Encrypts and persists analysis results (transcripts, summaries, action items,
   * decisions, questions, mind map) using the active workspace master key.
   */
  async saveEncryptedResults(analysisId, workspaceId, resultsObj) {
    if (!analysisId || !workspaceId) {
      throw new Error('Analysis ID and Workspace ID are required to save results.');
    }
    const masterKey = keyManagementService.getMasterKey();
    if (!masterKey) {
      throw new Error('Workspace is locked. Cannot encrypt analysis results.');
    }

    const aadString = `voxora:results:${workspaceId}:${analysisId}`;
    const encryptedPayload = await encryptData(masterKey, resultsObj, aadString);

    await db.analysisResults.put({
      analysisId,
      workspaceId,
      encryptedPayload,
      updatedAt: new Date().toISOString(),
    });

    return true;
  },

  /**
   * Retrieves and decrypts stored analysis results using the active workspace master key.
   */
  async getDecryptedResults(analysisId, workspaceId) {
    if (!analysisId || !workspaceId) return null;

    const record = await db.analysisResults.get(analysisId);
    if (!record || record.workspaceId !== workspaceId) {
      return null;
    }

    const masterKey = keyManagementService.getMasterKey();
    if (!masterKey) {
      throw new Error('Workspace is locked. Cannot decrypt analysis results.');
    }

    return await decryptData(masterKey, record.encryptedPayload);
  },

  // ── Encrypted Persistent Chat Operations ───────────────────────────────────

  /**
   * Encrypts and stores a chat message in the local workspace database.
   */
  async saveEncryptedChatMessage(analysisId, workspaceId, messageObj) {
    if (!analysisId || !workspaceId) {
      throw new Error('Analysis ID and Workspace ID are required to save chat messages.');
    }
    const masterKey = keyManagementService.getMasterKey();
    if (!masterKey) {
      throw new Error('Workspace is locked. Cannot encrypt chat message.');
    }

    const messageId = messageObj.id || crypto.randomUUID();
    const createdAt = messageObj.createdAt || new Date().toISOString();
    const payloadToEncrypt = {
      id: messageId,
      role: messageObj.role,
      text: messageObj.text,
      sources: messageObj.sources || [],
      timestamp: messageObj.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt,
    };

    const aadString = `voxora:chat:${workspaceId}:${analysisId}`;
    const encryptedPayload = await encryptData(masterKey, payloadToEncrypt, aadString);

    await db.analysisChats.add({
      id: messageId,
      workspaceId,
      analysisId,
      encryptedPayload,
      createdAt,
    });

    return payloadToEncrypt;
  },

  /**
   * Retrieves and decrypts chronological chat messages for an analysis.
   */
  async getDecryptedChatMessages(analysisId, workspaceId) {
    if (!analysisId || !workspaceId) return [];

    const records = await db.analysisChats
      .where('analysisId')
      .equals(analysisId)
      .filter((r) => r.workspaceId === workspaceId)
      .sortBy('createdAt');

    if (!records || records.length === 0) {
      return [];
    }

    const masterKey = keyManagementService.getMasterKey();
    if (!masterKey) {
      throw new Error('Workspace is locked. Cannot decrypt chat messages.');
    }

    const decryptedList = [];
    for (const r of records) {
      try {
        const decrypted = await decryptData(masterKey, r.encryptedPayload);
        decryptedList.push(decrypted);
      } catch (err) {
        console.warn('Failed to decrypt chat message:', err);
      }
    }

    return decryptedList;
  },

  /**
   * Clears all encrypted chat messages for an analysis.
   */
  async clearChatMessages(analysisId, workspaceId) {
    if (!analysisId || !workspaceId) return;

    await db.analysisChats
      .where('analysisId')
      .equals(analysisId)
      .filter((r) => r.workspaceId === workspaceId)
      .delete();
  },

  /**
   * Computes real workspace dashboard statistics from Dexie and OPFS.
   */
  async getWorkspaceStats(workspaceId) {
    if (!workspaceId) {
      return {
        totalAnalyses: 0,
        completedAnalyses: 0,
        savedAnalyses: 0,
        totalCollections: 0,
        storageBytes: 0,
      };
    }

    const analyses = await db.analyses.where('workspaceId').equals(workspaceId).toArray();
    const collections = await db.collections.where('workspaceId').equals(workspaceId).toArray();
    const mediaFiles = await db.mediaFiles.where('workspaceId').equals(workspaceId).toArray();

    const totalAnalyses = analyses.length;
    const completedAnalyses = analyses.filter((a) => a.status === 'completed').length;
    const savedAnalyses = analyses.filter((a) => a.isSaved).length;
    const totalCollections = collections.length;

    const storageBytes = mediaFiles.reduce((acc, file) => acc + (file.size || 0), 0);

    return {
      totalAnalyses,
      completedAnalyses,
      savedAnalyses,
      totalCollections,
      storageBytes,
    };
  },

  // ── Collections Operations ────────────────────────────────────────────────

  /**
   * Creates a new collection within a workspace.
   * Enforces unique name constraint per workspace (case-insensitive).
   */
  async createCollection({ workspaceId, name, description = '' }) {
    if (!workspaceId) {
      throw new Error('Workspace ID is required to create a collection.');
    }
    if (!name || !name.trim()) {
      throw new Error('Collection name is required.');
    }

    const trimmedName = name.trim();
    // Check for duplicate name in the same workspace (case-insensitive)
    const existing = await db.collections
      .where('workspaceId')
      .equals(workspaceId)
      .filter((c) => c.name.toLowerCase() === trimmedName.toLowerCase())
      .first();

    if (existing) {
      throw new Error(`A collection named "${trimmedName}" already exists in this workspace.`);
    }

    const now = new Date().toISOString();
    const collectionRecord = {
      id: crypto.randomUUID(),
      workspaceId,
      name: trimmedName,
      description: description.trim(),
      createdAt: now,
      updatedAt: now,
    };

    await db.collections.add(collectionRecord);
    return collectionRecord;
  },

  /**
   * Retrieves all collections for a workspace with accurate analysis counts.
   */
  async getCollectionsByWorkspace(workspaceId) {
    if (!workspaceId) return [];

    const collections = await db.collections
      .where('workspaceId')
      .equals(workspaceId)
      .toArray();

    // Attach analysis count to each collection
    const relations = await db.analysisCollections
      .where('workspaceId')
      .equals(workspaceId)
      .toArray();

    const countMap = {};
    relations.forEach((rel) => {
      countMap[rel.collectionId] = (countMap[rel.collectionId] || 0) + 1;
    });

    return collections.map((c) => ({
      ...c,
      analysisCount: countMap[c.id] || 0,
    }));
  },

  /**
   * Retrieves a single collection by ID, scoped to workspace.
   */
  async getCollectionById(id, workspaceId) {
    if (!id || !workspaceId) return null;
    const record = await db.collections.get(id);
    if (!record || record.workspaceId !== workspaceId) return null;

    const count = await db.analysisCollections
      .where('collectionId')
      .equals(id)
      .count();

    return {
      ...record,
      analysisCount: count,
    };
  },

  /**
   * Updates collection name and/or description.
   * Checks for duplicate name if name is changed.
   */
  async updateCollection(id, workspaceId, updates) {
    const existing = await this.getCollectionById(id, workspaceId);
    if (!existing) {
      throw new Error('Collection not found in this workspace.');
    }

    const safeUpdates = {
      updatedAt: new Date().toISOString(),
    };

    if (updates.name && updates.name.trim() !== existing.name) {
      const trimmedName = updates.name.trim();
      const duplicate = await db.collections
        .where('workspaceId')
        .equals(workspaceId)
        .filter((c) => c.name.toLowerCase() === trimmedName.toLowerCase() && c.id !== id)
        .first();

      if (duplicate) {
        throw new Error(`A collection named "${trimmedName}" already exists in this workspace.`);
      }
      safeUpdates.name = trimmedName;
    }

    if (typeof updates.description === 'string') {
      safeUpdates.description = updates.description.trim();
    }

    await db.collections.update(id, safeUpdates);
    return { ...existing, ...safeUpdates };
  },

  /**
   * Deletes a collection and its relations without deleting underlying analyses.
   */
  async deleteCollection(id, workspaceId) {
    const existing = await this.getCollectionById(id, workspaceId);
    if (!existing) return;

    await db.transaction('rw', [db.collections, db.analysisCollections], async () => {
      await db.collections.delete(id);
      await db.analysisCollections
        .where('collectionId')
        .equals(id)
        .delete();
    });
  },

  /**
   * Adds an analysis to a collection in an atomic transaction.
   */
  async addAnalysisToCollection(analysisId, collectionId, workspaceId) {
    if (!analysisId || !collectionId || !workspaceId) {
      throw new Error('analysisId, collectionId, and workspaceId are required.');
    }
    return db.transaction('rw', [db.analysisCollections, db.collections, db.analyses], async () => {
      const col = await db.collections.get(collectionId);
      if (!col || col.workspaceId !== workspaceId) {
        throw new Error('Target collection does not exist in this workspace.');
      }
      const existingRelation = await db.analysisCollections
        .where('[analysisId+collectionId]')
        .equals([analysisId, collectionId])
        .first();

      if (existingRelation) return existingRelation;

      const record = {
        id: crypto.randomUUID(),
        workspaceId,
        analysisId,
        collectionId,
      };

      await db.analysisCollections.add(record);
      return record;
    });
  },

  /**
   * Removes an analysis from a collection in an atomic transaction.
   */
  async removeAnalysisFromCollection(analysisId, collectionId, workspaceId) {
    if (!analysisId || !collectionId) return;
    await db.transaction('rw', db.analysisCollections, async () => {
      await db.analysisCollections
        .where('[analysisId+collectionId]')
        .equals([analysisId, collectionId])
        .delete();
    });
  },

  /**
   * Retrieves all analyses belonging to a specific collection.
   */
  async getAnalysesInCollection(collectionId, workspaceId) {
    const relations = await db.analysisCollections
      .where('collectionId')
      .equals(collectionId)
      .toArray();

    const analysisIds = relations.map((r) => r.analysisId);
    if (analysisIds.length === 0) return [];

    const analyses = await db.analyses
      .where('id')
      .anyOf(analysisIds)
      .filter((a) => a.workspaceId === workspaceId)
      .toArray();

    return analyses;
  },

  /**
   * Retrieves all collection IDs and names that an analysis belongs to.
   */
  async getCollectionsForAnalysis(analysisId, workspaceId) {
    const relations = await db.analysisCollections
      .where('analysisId')
      .equals(analysisId)
      .toArray();

    const collectionIds = relations.map((r) => r.collectionId);
    if (collectionIds.length === 0) return [];

    return db.collections
      .where('id')
      .anyOf(collectionIds)
      .filter((c) => c.workspaceId === workspaceId)
      .toArray();
  },
};


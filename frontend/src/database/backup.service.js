import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';
import { db } from './db';
import { workspaceRepository } from './workspace.repository';
import { storageService } from './storage.service';
import { CURRENT_SCHEMA_VERSION } from './schema';
import {
  deriveKeyEncryptionKey,
  unwrapMasterKey,
  wrapMasterKey,
  encryptData,
  decryptData,
} from './encryption.service';

/**
 * Encrypted Workspace Backup & Export / Import Service.
 * Bundles encrypted IndexedDB records, key envelopes, analyses, collections,
 * and OPFS media binaries into a single portable `.voxora` archive.
 */
export const backupService = {
  /**
   * Exports an entire workspace into a `.voxora` zip blob.
   */
  async exportWorkspace(workspaceId) {
    const ws = await workspaceRepository.getWorkspaceById(workspaceId);
    if (!ws) {
      throw new Error('Workspace not found for export.');
    }

    const settings = await workspaceRepository.getSettings(workspaceId);
    const metadata = await workspaceRepository.getMetadata(workspaceId);
    const mediaList = await workspaceRepository.listMediaFiles(workspaceId);
    const analyses = await db.analyses.where('workspaceId').equals(workspaceId).toArray();
    const collections = await db.collections.where('workspaceId').equals(workspaceId).toArray();
    const relations = await db.analysisCollections.where('workspaceId').equals(workspaceId).toArray();
    const analysisResults = await db.analysisResults.where('workspaceId').equals(workspaceId).toArray();
    const analysisChats = await db.analysisChats.where('workspaceId').equals(workspaceId).toArray();

    const manifest = {
      archiveFormat: 'voxora-backup',
      archiveVersion: 2,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      workspaceId: ws.id,
      workspaceName: ws.workspaceName,
      displayName: ws.displayName,
      exportedAt: new Date().toISOString(),
      mediaCount: mediaList.length,
      analysesCount: analyses.length,
      collectionsCount: collections.length,
      resultsCount: analysisResults.length,
      chatsCount: analysisChats.length,
    };

    const zipFiles = {};

    // 1. Pack Manifest and Encrypted Records (as UTF-8 strings)
    zipFiles['manifest.json'] = strToU8(JSON.stringify(manifest, null, 2));
    zipFiles['workspace.json'] = strToU8(JSON.stringify(ws, null, 2));
    if (settings) {
      zipFiles['settings.json'] = strToU8(JSON.stringify(settings, null, 2));
    }
    if (metadata) {
      zipFiles['metadata.json'] = strToU8(JSON.stringify(metadata, null, 2));
    }
    zipFiles['media_index.json'] = strToU8(JSON.stringify(mediaList, null, 2));
    zipFiles['analyses.json'] = strToU8(JSON.stringify(analyses, null, 2));
    zipFiles['collections.json'] = strToU8(JSON.stringify(collections, null, 2));
    zipFiles['analysis_collections.json'] = strToU8(JSON.stringify(relations, null, 2));
    zipFiles['analysis_results.json'] = strToU8(JSON.stringify(analysisResults, null, 2));
    zipFiles['analysis_chats.json'] = strToU8(JSON.stringify(analysisChats, null, 2));

    // 2. Pack OPFS Media Binaries (if any and if storage is available)
    if (storageService.isAvailable() && mediaList.length > 0) {
      for (const media of mediaList) {
        try {
          const file = await storageService.getMedia(workspaceId, media.id);
          if (file) {
            const arrayBuffer = await file.arrayBuffer();
            zipFiles[`media/${media.id}`] = new Uint8Array(arrayBuffer);
          }
        } catch (err) {
          console.warn(`Could not export media file ${media.id}:`, err);
        }
      }
    }

    // 3. Compress into `.voxora` zip archive
    const zipped = zipSync(zipFiles, { level: 6 });
    return new Blob([zipped], { type: 'application/x-voxora-workspace' });
  },

  /**
   * Imports a `.voxora` archive file into the local device.
   * Handles archive validation, schema versioning, and collision prevention.
   */
  async importWorkspace(fileOrBlob, options = { renameOnConflict: true }) {
    if (!fileOrBlob) {
      throw new Error('No backup file provided.');
    }

    const arrayBuffer = await fileOrBlob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    let unzipped;
    try {
      unzipped = unzipSync(bytes);
    } catch (err) {
      throw new Error('Corrupt or invalid .voxora archive. Decompression failed.');
    }

    // 1. Verify Manifest
    if (!unzipped['manifest.json']) {
      throw new Error('Invalid archive: missing manifest.json header.');
    }

    let manifest;
    try {
      manifest = JSON.parse(strFromU8(unzipped['manifest.json']));
    } catch {
      throw new Error('Malformed manifest.json in backup archive.');
    }

    if (manifest.archiveFormat !== 'voxora-backup') {
      throw new Error('Unrecognized archive format. Expected a .voxora workspace backup.');
    }

    if (manifest.schemaVersion > CURRENT_SCHEMA_VERSION) {
      throw new Error(
        `Archive schema version (${manifest.schemaVersion}) is newer than supported (${CURRENT_SCHEMA_VERSION}). Please update Voxora AI.`
      );
    }

    // 2. Parse Workspace record
    if (!unzipped['workspace.json']) {
      throw new Error('Invalid archive: missing workspace.json envelope record.');
    }

    let wsRecord;
    try {
      wsRecord = JSON.parse(strFromU8(unzipped['workspace.json']));
    } catch {
      throw new Error('Malformed workspace.json in backup archive.');
    }

    if (!wsRecord.wrappedMasterKeyByPassword || !wsRecord.passwordSalt) {
      throw new Error('Incomplete workspace record: missing encryption envelopes.');
    }

    // 3. Check for Collision with existing local workspaces
    const originalWorkspaceId = wsRecord.id;
    let targetWorkspaceId = wsRecord.id;
    let targetWorkspaceName = wsRecord.workspaceName;

    const existingById = await workspaceRepository.getWorkspaceById(targetWorkspaceId);
    const existingByName = await workspaceRepository.findByName(targetWorkspaceName);

    if (existingById || existingByName) {
      if (options.renameOnConflict) {
        if (existingByName && !existingById) {
          // If only the name collided, retain original targetWorkspaceId to preserve cryptographic AAD binding
          targetWorkspaceName = `${targetWorkspaceName} (Imported)`;
          wsRecord.workspaceName = targetWorkspaceName;
        } else {
          // An identical workspace UUID already exists on this machine
          targetWorkspaceId = crypto.randomUUID();
          targetWorkspaceName = `${targetWorkspaceName} (Imported)`;
          wsRecord.id = targetWorkspaceId;
          wsRecord.workspaceName = targetWorkspaceName;
        }
      } else {
        throw new Error(
          `A workspace named "${targetWorkspaceName}" already exists on this device.`
        );
      }
    }

    // 4. Parse Settings and Metadata
    let settingsRecord = null;
    if (unzipped['settings.json']) {
      try {
        settingsRecord = JSON.parse(strFromU8(unzipped['settings.json']));
        settingsRecord.id = crypto.randomUUID();
        settingsRecord.workspaceId = targetWorkspaceId;
      } catch (e) {
        console.warn('Could not parse settings.json from archive:', e);
      }
    }

    let metadataRecord = null;
    if (unzipped['metadata.json']) {
      try {
        metadataRecord = JSON.parse(strFromU8(unzipped['metadata.json']));
        metadataRecord.id = crypto.randomUUID();
        metadataRecord.workspaceId = targetWorkspaceId;
      } catch (e) {
        console.warn('Could not parse metadata.json from archive:', e);
      }
    }

    // 5. Parse Media List
    let mediaList = [];
    if (unzipped['media_index.json']) {
      try {
        mediaList = JSON.parse(strFromU8(unzipped['media_index.json']));
      } catch {
        mediaList = [];
      }
    }

    // 6. Parse Analyses, Collections, and Relations
    let analyses = [];
    if (unzipped['analyses.json']) {
      try {
        analyses = JSON.parse(strFromU8(unzipped['analyses.json']));
      } catch {
        analyses = [];
      }
    }

    let collections = [];
    if (unzipped['collections.json']) {
      try {
        collections = JSON.parse(strFromU8(unzipped['collections.json']));
      } catch {
        collections = [];
      }
    }

    let relations = [];
    if (unzipped['analysis_collections.json']) {
      try {
        relations = JSON.parse(strFromU8(unzipped['analysis_collections.json']));
      } catch {
        relations = [];
      }
    }

    let analysisResults = [];
    if (unzipped['analysis_results.json']) {
      try {
        analysisResults = JSON.parse(strFromU8(unzipped['analysis_results.json']));
      } catch {
        analysisResults = [];
      }
    }

    let analysisChats = [];
    if (unzipped['analysis_chats.json']) {
      try {
        analysisChats = JSON.parse(strFromU8(unzipped['analysis_chats.json']));
      } catch {
        analysisChats = [];
      }
    }

    // 6b. Re-encrypt AAD-bound records if workspace ID changed on collision
    if (targetWorkspaceId !== originalWorkspaceId) {
      wsRecord.originalWorkspaceId = originalWorkspaceId;

      if (options.password) {
        const iterations = wsRecord.keyDerivationParameters?.iterations || 600000;
        const passwordKek = await deriveKeyEncryptionKey(
          options.password,
          wsRecord.passwordSalt,
          iterations
        );

        const masterKeyCrypto = await unwrapMasterKey(
          wsRecord.wrappedMasterKeyByPassword,
          passwordKek,
          originalWorkspaceId
        );

        const rawMasterBytes = await crypto.subtle.exportKey('raw', masterKeyCrypto);

        // Re-wrap master key with new workspaceId
        wsRecord.wrappedMasterKeyByPassword = await wrapMasterKey(
          new Uint8Array(rawMasterBytes),
          passwordKek,
          targetWorkspaceId,
          'password'
        );

        // Update key check value canary for new workspaceId
        const { createKeyCheckValue } = await import('./encryption.service');
        wsRecord.keyCheckValue = await createKeyCheckValue(masterKeyCrypto, targetWorkspaceId);

        if (wsRecord.wrappedMasterKeyByRecovery && options.recoveryMnemonic) {
          try {
            const recoveryKek = await deriveKeyEncryptionKey(
              options.recoveryMnemonic.trim().toLowerCase(),
              wsRecord.recoverySalt,
              iterations
            );
            wsRecord.wrappedMasterKeyByRecovery = await wrapMasterKey(
              new Uint8Array(rawMasterBytes),
              recoveryKek,
              targetWorkspaceId,
              'recovery'
            );
          } catch (recErr) {
            console.warn('Could not re-wrap recovery key envelope:', recErr);
          }
        }

        // Re-encrypt settingsRecord
        if (settingsRecord?.encryptedPayload) {
          try {
            const decryptedSettings = await decryptData(
              masterKeyCrypto,
              settingsRecord.encryptedPayload,
              `voxora:settings:${originalWorkspaceId}`
            );
            settingsRecord.encryptedPayload = await encryptData(
              masterKeyCrypto,
              decryptedSettings,
              `voxora:settings:${targetWorkspaceId}`
            );
          } catch (e) {
            console.warn('Could not re-encrypt settings for new workspaceId:', e);
          }
        }

        // Re-encrypt metadataRecord
        if (metadataRecord?.encryptedPayload) {
          try {
            const decryptedMetadata = await decryptData(
              masterKeyCrypto,
              metadataRecord.encryptedPayload,
              `voxora:meta:${originalWorkspaceId}`
            );
            metadataRecord.encryptedPayload = await encryptData(
              masterKeyCrypto,
              decryptedMetadata,
              `voxora:meta:${targetWorkspaceId}`
            );
          } catch (e) {
            console.warn('Could not re-encrypt metadata for new workspaceId:', e);
          }
        }

        // Re-encrypt analysisResults
        for (const res of analysisResults) {
          if (res.encryptedResults) {
            try {
              const decryptedRes = await decryptData(
                masterKeyCrypto,
                res.encryptedResults,
                `voxora:results:${originalWorkspaceId}:${res.analysisId}`
              );
              res.encryptedResults = await encryptData(
                masterKeyCrypto,
                decryptedRes,
                `voxora:results:${targetWorkspaceId}:${res.analysisId}`
              );
            } catch (e) {
              console.warn(`Could not re-encrypt results for analysis ${res.analysisId}:`, e);
            }
          }
        }

        // Re-encrypt analysisChats
        for (const chat of analysisChats) {
          if (chat.encryptedChat) {
            try {
              const decryptedChat = await decryptData(
                masterKeyCrypto,
                chat.encryptedChat,
                `voxora:chat:${originalWorkspaceId}:${chat.analysisId}`
              );
              chat.encryptedChat = await encryptData(
                masterKeyCrypto,
                decryptedChat,
                `voxora:chat:${targetWorkspaceId}:${chat.analysisId}`
              );
            } catch (e) {
              console.warn(`Could not re-encrypt chat for analysis ${chat.analysisId}:`, e);
            }
          }
        }

        // Re-encryption complete, remove temporary originalWorkspaceId flag
        delete wsRecord.originalWorkspaceId;
      }
    }

    // 7. Commit Database Transaction
    await workspaceRepository.createWorkspaceTransaction(
      wsRecord,
      settingsRecord,
      metadataRecord
    );

    // Commit analyses, collections, results, and chats
    if (
      analyses.length > 0 ||
      collections.length > 0 ||
      relations.length > 0 ||
      analysisResults.length > 0 ||
      analysisChats.length > 0
    ) {
      await db.transaction(
        'rw',
        [db.analyses, db.collections, db.analysisCollections, db.analysisResults, db.analysisChats],
        async () => {
          for (const item of analyses) {
            await db.analyses.put({ ...item, workspaceId: targetWorkspaceId });
          }
          for (const col of collections) {
            await db.collections.put({ ...col, workspaceId: targetWorkspaceId });
          }
          for (const rel of relations) {
            await db.analysisCollections.put({ ...rel, workspaceId: targetWorkspaceId });
          }
          for (const res of analysisResults) {
            await db.analysisResults.put({ ...res, workspaceId: targetWorkspaceId });
          }
          for (const chat of analysisChats) {
            await db.analysisChats.put({ ...chat, workspaceId: targetWorkspaceId });
          }
        }
      );
    }

    // 8. Extract Media Files into OPFS
    if (storageService.isAvailable() && mediaList.length > 0) {
      for (const media of mediaList) {
        const mediaBytes = unzipped[`media/${media.id}`];
        if (mediaBytes) {
          try {
            await storageService.saveMedia(
              targetWorkspaceId,
              media.id,
              mediaBytes,
              media.filename,
              media.mimeType,
              media.metadata
            );
          } catch (err) {
            console.warn(`Failed to restore media ${media.id} into OPFS:`, err);
          }
        }
      }
    }

    return {
      workspaceId: targetWorkspaceId,
      workspaceName: targetWorkspaceName,
      displayName: wsRecord.displayName,
      importedAt: new Date().toISOString(),
    };
  },
};

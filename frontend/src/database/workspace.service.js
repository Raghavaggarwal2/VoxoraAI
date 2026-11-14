import {
  generateRandomMasterKeyBytes,
  generateSalt,
  deriveKeyEncryptionKey,
  importMasterKey,
  wrapMasterKey,
  unwrapMasterKey,
  createKeyCheckValue,
  verifyKeyCheckValue,
  encryptData,
  decryptData,
  wipeBytes,
  base64ToBuffer,
} from './encryption.service';
import { generateRecoveryMnemonic, validateRecoveryMnemonic } from './recovery.service';
import { workspaceRepository } from './workspace.repository';
import { keyManagementService } from './key-management.service';
import { sessionService } from './session.service';
import { CURRENT_SCHEMA_VERSION } from './schema';

export const workspaceService = {
  /**
   * Discovers and lists all local workspaces.
   */
  async listWorkspaces() {
    return workspaceRepository.getAllWorkspaces();
  },

  /**
   * Creates a new local workspace with envelope encryption.
   * Returns the workspace record and the one-time 24-word recovery key.
   */
  async createWorkspace({ workspaceName, displayName, email = '', password, iterations = 600000 }) {
    if (!workspaceName || !workspaceName.trim()) {
      throw new Error('Workspace name is required.');
    }
    if (!displayName || !displayName.trim()) {
      throw new Error('Display name is required.');
    }
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    const trimmedName = workspaceName.trim();
    const existing = await workspaceRepository.findByName(trimmedName);
    if (existing) {
      throw new Error(`A workspace named "${trimmedName}" already exists on this device.`);
    }

    const workspaceId = crypto.randomUUID();
    const now = new Date().toISOString();

    // 1. Generate Random 256-bit Master Key
    const masterKeyBytes = generateRandomMasterKeyBytes();
    const masterCryptoKey = await importMasterKey(masterKeyBytes);

    // 2. Derive Password KEK
    const passwordSalt = generateSalt();
    const keyDerivationParameters = {
      algorithm: 'PBKDF2-HMAC-SHA256',
      iterations,
      hash: 'SHA-256',
    };
    const passwordKek = await deriveKeyEncryptionKey(
      password,
      passwordSalt,
      keyDerivationParameters.iterations
    );

    // 3. Wrap Master Key with Password KEK
    const wrappedMasterKeyByPassword = await wrapMasterKey(
      masterKeyBytes,
      passwordKek,
      workspaceId,
      'password'
    );

    // 4. Generate 24-word BIP-39 Recovery Mnemonic & derive Recovery KEK
    const recoveryMnemonic = await generateRecoveryMnemonic();
    const recoverySalt = generateSalt();
    const recoveryKek = await deriveKeyEncryptionKey(
      recoveryMnemonic.trim().toLowerCase(),
      recoverySalt,
      keyDerivationParameters.iterations
    );

    // 5. Wrap Master Key with Recovery KEK
    const wrappedMasterKeyByRecovery = await wrapMasterKey(
      masterKeyBytes,
      recoveryKek,
      workspaceId,
      'recovery'
    );

    // 6. Generate Authenticated Key-Check Canary
    const keyCheckValue = await createKeyCheckValue(masterCryptoKey, workspaceId);

    // 7. Encrypt Sensitive Profile Data (optional email)
    const profileData = {
      displayName: displayName.trim(),
      email: email ? email.trim() : null,
    };
    const encryptedMetadataPayload = await encryptData(
      masterCryptoKey,
      profileData,
      `voxora:meta:${workspaceId}`
    );

    // 8. Encrypt Default Settings (24-hour default session for local-first desktop usage)
    const defaultSettings = {
      autoLockMinutes: 1440, // 24 hours
      rememberSelectedWorkspace: true,
      createdWithVersion: CURRENT_SCHEMA_VERSION,
    };
    const encryptedSettingsPayload = await encryptData(
      masterCryptoKey,
      defaultSettings,
      `voxora:settings:${workspaceId}`
    );

    // 9. Prepare IndexedDB Records
    const workspaceRecord = {
      id: workspaceId,
      workspaceName: trimmedName,
      displayName: displayName.trim(),
      createdAt: now,
      updatedAt: now,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      passwordSalt,
      recoverySalt,
      keyDerivationParameters,
      wrappedMasterKeyByPassword,
      wrappedMasterKeyByRecovery,
      keyCheckValue,
    };

    const settingsRecord = {
      id: crypto.randomUUID(),
      workspaceId,
      encryptedPayload: encryptedSettingsPayload,
      updatedAt: now,
    };

    const metadataRecord = {
      id: crypto.randomUUID(),
      workspaceId,
      encryptedPayload: encryptedMetadataPayload,
      updatedAt: now,
    };

    // 10. Persist atomically to IndexedDB
    await workspaceRepository.createWorkspaceTransaction(
      workspaceRecord,
      settingsRecord,
      metadataRecord
    );

    // 11. Retain master key in memory and save 24-hour session
    keyManagementService.setMasterKey(workspaceId, masterCryptoKey, masterKeyBytes);
    sessionService.saveSession(workspaceId, masterKeyBytes);

    return {
      workspace: {
        id: workspaceRecord.id,
        workspaceName: workspaceRecord.workspaceName,
        displayName: workspaceRecord.displayName,
        createdAt: workspaceRecord.createdAt,
        updatedAt: workspaceRecord.updatedAt,
      },
      recoveryKey: recoveryMnemonic,
    };
  },

  /**
   * Unlocks a local workspace using the user's password.
   */
  async unlockWithPassword(workspaceId, password) {
    if (!password) {
      throw new Error('Password is required.');
    }

    const ws = await workspaceRepository.getWorkspaceById(workspaceId);
    if (!ws) {
      throw new Error('Workspace not found on this device.');
    }

    try {
      // Derive Password KEK
      const iterations = ws.keyDerivationParameters?.iterations || 600000;
      const passwordKek = await deriveKeyEncryptionKey(password, ws.passwordSalt, iterations);

      // Unwrap Master Key
      let rawMasterKeyBytes;
      let usedOriginalWorkspaceId = false;

      try {
        rawMasterKeyBytes = await unwrapMasterKey(
          ws.wrappedMasterKeyByPassword,
          passwordKek,
          workspaceId
        );
      } catch (firstUnwrapErr) {
        if (ws.originalWorkspaceId) {
          rawMasterKeyBytes = await unwrapMasterKey(
            ws.wrappedMasterKeyByPassword,
            passwordKek,
            ws.originalWorkspaceId
          );
          usedOriginalWorkspaceId = true;
        } else {
          throw firstUnwrapErr;
        }
      }

      const masterCryptoKey = await importMasterKey(rawMasterKeyBytes);

      // Verify Key Check Canary
      const checkWorkspaceId = usedOriginalWorkspaceId ? ws.originalWorkspaceId : workspaceId;
      const isValid = await verifyKeyCheckValue(masterCryptoKey, ws.keyCheckValue, checkWorkspaceId);
      if (!isValid) {
        throw new Error('Verification failed: corrupted key or invalid canary.');
      }

      // If imported workspace was using originalWorkspaceId, heal/re-bind it now to new workspaceId
      if (usedOriginalWorkspaceId) {
        const newWrappedMasterKeyByPassword = await wrapMasterKey(
          rawMasterKeyBytes,
          passwordKek,
          workspaceId,
          'password'
        );
        const newKeyCheckValue = await createKeyCheckValue(masterCryptoKey, workspaceId);

        // Re-encrypt settings
        const settingsRecord = await workspaceRepository.getSettings(workspaceId);
        if (settingsRecord?.encryptedPayload) {
          try {
            const decSettings = await decryptData(
              masterCryptoKey,
              settingsRecord.encryptedPayload,
              `voxora:settings:${ws.originalWorkspaceId}`
            );
            const encSettings = await encryptData(
              masterCryptoKey,
              decSettings,
              `voxora:settings:${workspaceId}`
            );
            await workspaceRepository.updateSettings(workspaceId, encSettings);
          } catch (e) {
            console.warn('Could not re-encrypt settings on unlock:', e);
          }
        }

        // Re-encrypt metadata
        const metadataRecord = await workspaceRepository.getMetadata(workspaceId);
        if (metadataRecord?.encryptedPayload) {
          try {
            const decMeta = await decryptData(
              masterCryptoKey,
              metadataRecord.encryptedPayload,
              `voxora:meta:${ws.originalWorkspaceId}`
            );
            const encMeta = await encryptData(
              masterCryptoKey,
              decMeta,
              `voxora:meta:${workspaceId}`
            );
            await workspaceRepository.updateMetadata(workspaceId, encMeta);
          } catch (e) {
            console.warn('Could not re-encrypt metadata on unlock:', e);
          }
        }

        await workspaceRepository.updateWorkspace(workspaceId, {
          wrappedMasterKeyByPassword: newWrappedMasterKeyByPassword,
          keyCheckValue: newKeyCheckValue,
          originalWorkspaceId: null,
        });
      }

      // Store in memory and save 24-hour session
      keyManagementService.setMasterKey(workspaceId, masterCryptoKey, rawMasterKeyBytes);
      sessionService.saveSession(workspaceId, rawMasterKeyBytes);

      // Decrypt settings
      const settings = await this.getDecryptedSettings(workspaceId);

      return {
        workspace: {
          id: ws.id,
          workspaceName: ws.workspaceName,
          displayName: ws.displayName,
          createdAt: ws.createdAt,
          updatedAt: ws.updatedAt,
        },
        settings,
      };
    } catch (err) {
      // Normalize error to prevent leaking cryptographic traces
      throw new Error('Incorrect password. Please verify your credentials and try again.');
    }
  },

  /**
   * Unlocks a local workspace using the 24-word recovery phrase.
   */
  async unlockWithRecoveryKey(workspaceId, recoveryMnemonic) {
    if (!recoveryMnemonic) {
      throw new Error('Recovery phrase is required.');
    }

    const normalizedMnemonic = recoveryMnemonic.trim().toLowerCase();
    const isValidMnemonic = await validateRecoveryMnemonic(normalizedMnemonic);
    if (!isValidMnemonic) {
      throw new Error('Invalid recovery phrase format. Ensure all 24 words are spelled correctly.');
    }

    const ws = await workspaceRepository.getWorkspaceById(workspaceId);
    if (!ws) {
      throw new Error('Workspace not found on this device.');
    }

    try {
      const iterations = ws.keyDerivationParameters?.iterations || 600000;
      const recoveryKek = await deriveKeyEncryptionKey(
        normalizedMnemonic,
        ws.recoverySalt,
        iterations
      );

      let rawMasterKeyBytes;
      let usedOriginalWorkspaceId = false;

      try {
        rawMasterKeyBytes = await unwrapMasterKey(
          ws.wrappedMasterKeyByRecovery,
          recoveryKek,
          workspaceId
        );
      } catch (firstUnwrapErr) {
        if (ws.originalWorkspaceId) {
          rawMasterKeyBytes = await unwrapMasterKey(
            ws.wrappedMasterKeyByRecovery,
            recoveryKek,
            ws.originalWorkspaceId
          );
          usedOriginalWorkspaceId = true;
        } else {
          throw firstUnwrapErr;
        }
      }

      const masterCryptoKey = await importMasterKey(rawMasterKeyBytes);

      const checkWorkspaceId = usedOriginalWorkspaceId ? ws.originalWorkspaceId : workspaceId;
      const isValid = await verifyKeyCheckValue(masterCryptoKey, ws.keyCheckValue, checkWorkspaceId);
      if (!isValid) {
        throw new Error('Recovery phrase does not match this workspace.');
      }

      keyManagementService.setMasterKey(workspaceId, masterCryptoKey, rawMasterKeyBytes);
      sessionService.saveSession(workspaceId, rawMasterKeyBytes);
      const settings = await this.getDecryptedSettings(workspaceId);

      return {
        workspace: {
          id: ws.id,
          workspaceName: ws.workspaceName,
          displayName: ws.displayName,
          createdAt: ws.createdAt,
          updatedAt: ws.updatedAt,
        },
        settings,
      };
    } catch (err) {
      throw new Error('Invalid recovery key for this workspace. Please verify the phrase.');
    }
  },

  /**
   * Attempts to restore an active unlocked session from the 24-hour expiration window.
   * Validates canary before restoring into memory.
   */
  async restoreSession() {
    const session = sessionService.getSession();
    if (!session) return null;

    const ws = await workspaceRepository.getWorkspaceById(session.workspaceId);
    if (!ws) {
      sessionService.clearSession();
      return null;
    }

    try {
      const rawMasterKeyBytes = base64ToBuffer(session.masterKeyBase64);
      const masterCryptoKey = await importMasterKey(rawMasterKeyBytes);

      // Verify Key Check Canary
      const isValid = await verifyKeyCheckValue(masterCryptoKey, ws.keyCheckValue, ws.id);
      if (!isValid) {
        sessionService.clearSession();
        return null;
      }

      // Restore active master key into ephemeral memory
      keyManagementService.setMasterKey(ws.id, masterCryptoKey, rawMasterKeyBytes);
      const settings = await this.getDecryptedSettings(ws.id);

      return {
        workspace: {
          id: ws.id,
          workspaceName: ws.workspaceName,
          displayName: ws.displayName,
          createdAt: ws.createdAt,
          updatedAt: ws.updatedAt,
        },
        settings,
      };
    } catch (err) {
      console.warn('Session restoration failed:', err);
      sessionService.clearSession();
      return null;
    }
  },

  /**
   * Locks the active workspace and cleans up session and memory.
   */
  lockWorkspace() {
    sessionService.clearSession();
    keyManagementService.clear();
  },

  /**
   * Changes the workspace password without re-encrypting underlying workspace records.
   * Rewraps the master key with a newly derived KEK.
   */
  async changePassword(workspaceId, currentPassword, newPassword) {
    if (!keyManagementService.isUnlocked(workspaceId)) {
      throw new Error('Workspace must be unlocked to change password.');
    }
    if (!newPassword || newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long.');
    }

    const ws = await workspaceRepository.getWorkspaceById(workspaceId);
    if (!ws) {
      throw new Error('Workspace record not found.');
    }

    // Verify current password first
    const iterations = ws.keyDerivationParameters?.iterations || 600000;
    const oldKek = await deriveKeyEncryptionKey(currentPassword, ws.passwordSalt, iterations);
    try {
      await unwrapMasterKey(ws.wrappedMasterKeyByPassword, oldKek, workspaceId);
    } catch {
      throw new Error('Current password is incorrect.');
    }

    // Get current raw master key
    let rawBytes = keyManagementService.getRawKeyBytes();
    if (!rawBytes) {
      rawBytes = await unwrapMasterKey(ws.wrappedMasterKeyByPassword, oldKek, workspaceId);
    }

    // Generate new salt and derive new password KEK
    const newPasswordSalt = generateSalt();
    const newKek = await deriveKeyEncryptionKey(newPassword, newPasswordSalt, iterations);

    // Rewrap master key with new password KEK
    const newWrappedMasterKeyByPassword = await wrapMasterKey(
      rawBytes,
      newKek,
      workspaceId,
      'password'
    );

    // Update in database
    await workspaceRepository.updateWorkspace(workspaceId, {
      passwordSalt: newPasswordSalt,
      wrappedMasterKeyByPassword: newWrappedMasterKeyByPassword,
    });

    return true;
  },

  /**
   * Retrieves and decrypts workspace settings.
   */
  async getDecryptedSettings(workspaceId) {
    const masterKey = keyManagementService.getMasterKey();
    if (!masterKey) return null;

    const row = await workspaceRepository.getSettings(workspaceId);
    if (!row || !row.encryptedPayload) return null;

    try {
      return await decryptData(masterKey, row.encryptedPayload);
    } catch {
      console.warn('Could not decrypt workspace settings.');
      return null;
    }
  },

  /**
   * Encrypts and updates workspace settings.
   */
  async updateSettings(workspaceId, settingsObj) {
    const masterKey = keyManagementService.getMasterKey();
    if (!masterKey) {
      throw new Error('Cannot update settings: workspace is locked.');
    }

    const encrypted = await encryptData(
      masterKey,
      settingsObj,
      `voxora:settings:${workspaceId}`
    );

    await workspaceRepository.updateSettings(workspaceId, encrypted);
    return settingsObj;
  },
};


import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db';
import {
  generateRecoveryMnemonic,
  validateRecoveryMnemonic,
  entropyToMnemonic,
  mnemonicToEntropy,
  BIP39_ENGLISH_WORDLIST,
} from '../recovery.service';
import {
  generateRandomMasterKeyBytes,
  generateSalt,
  deriveKeyEncryptionKey,
  importMasterKey,
  wrapMasterKey,
  unwrapMasterKey,
  encryptData,
  decryptData,
  createKeyCheckValue,
  verifyKeyCheckValue,
} from '../encryption.service';
import { workspaceService } from '../workspace.service';
import { keyManagementService } from '../key-management.service';
import { sessionService, getStorage } from '../session.service';
import { storageService } from '../storage.service';
import { backupService } from '../backup.service';

// Use 10,000 iterations for test execution speed while verifying exact PBKDF2 Web Crypto operations
const TEST_ITERATIONS = 10000;

describe('Voxora AI — Local Workspace Engine & Security Tests', () => {
  beforeEach(async () => {
    // Reset IndexedDB tables and memory state before each test
    await db.workspaces.clear();
    await db.workspaceSettings.clear();
    await db.workspaceMetadata.clear();
    await db.mediaFiles.clear();
    keyManagementService.clear();
    sessionService.clearSession();
  });

  // ── 1. Recovery Key & BIP-39 Standards ────────────────────────────────────
  describe('BIP-39 Recovery Service', () => {
    it('generates a cryptographically valid 24-word mnemonic', async () => {
      const mnemonic = await generateRecoveryMnemonic();
      const words = mnemonic.split(' ');
      expect(words).toHaveLength(24);

      for (const word of words) {
        expect(BIP39_ENGLISH_WORDLIST).toContain(word);
      }

      const isValid = await validateRecoveryMnemonic(mnemonic);
      expect(isValid).toBe(true);
    });

    it('rejects invalid or corrupted recovery phrases', async () => {
      expect(await validateRecoveryMnemonic('')).toBe(false);
      expect(await validateRecoveryMnemonic('not enough words')).toBe(false);

      const validMnemonic = await generateRecoveryMnemonic();
      const words = validMnemonic.split(' ');
      words[23] = words[23] === 'zoo' ? 'zone' : 'zoo';
      const corrupted = words.join(' ');

      const isValid = await validateRecoveryMnemonic(corrupted);
      expect(isValid).toBe(false);
    });

    it('converts entropy to mnemonic and back deterministically', async () => {
      const originalEntropy = new Uint8Array(32);
      crypto.getRandomValues(originalEntropy);

      const mnemonic = await entropyToMnemonic(originalEntropy);
      const recoveredEntropy = await mnemonicToEntropy(mnemonic);

      expect(recoveredEntropy).toEqual(originalEntropy);
    });
  });

  // ── 2. Cryptography & Envelope Encryption ─────────────────────────────────
  describe('Encryption & Key Wrapping', () => {
    it('encrypts and decrypts records round-trip with master key', async () => {
      const masterBytes = generateRandomMasterKeyBytes();
      const masterKey = await importMasterKey(masterBytes);

      const payload = { title: 'Confidential Analysis', tags: ['ai', 'voxora'] };
      const encrypted = await encryptData(masterKey, payload, 'voxora:test:aad');

      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.iv).toBeDefined();

      const decrypted = await decryptData(masterKey, encrypted);
      expect(decrypted).toEqual(payload);
    });

    it('generates a fresh, unique IV for every single encryption', async () => {
      const masterBytes = generateRandomMasterKeyBytes();
      const masterKey = await importMasterKey(masterBytes);

      const payload = { secret: 'identical_text' };
      const enc1 = await encryptData(masterKey, payload);
      const enc2 = await encryptData(masterKey, payload);

      expect(enc1.iv).not.toEqual(enc2.iv);
      expect(enc1.ciphertext).not.toEqual(enc2.ciphertext);
    });

    it('rejects tampered ciphertexts and mismatched AAD', async () => {
      const masterBytes = generateRandomMasterKeyBytes();
      const masterKey = await importMasterKey(masterBytes);

      const encrypted = await encryptData(masterKey, 'safe data', 'workspace:1');

      await expect(
        decryptData(masterKey, { ...encrypted, aad: 'workspace:tampered' })
      ).rejects.toThrow();
    });

    it('wraps and unwraps master key using password KEK', async () => {
      const masterBytes = generateRandomMasterKeyBytes();
      const salt = generateSalt();
      const password = 'SuperSecurePassword123!';

      const kek = await deriveKeyEncryptionKey(password, salt, TEST_ITERATIONS);
      const envelope = await wrapMasterKey(masterBytes, kek, 'ws-uuid-1', 'password');

      const unwrappedBytes = await unwrapMasterKey(envelope, kek, 'ws-uuid-1');
      expect(unwrappedBytes).toEqual(masterBytes);
    });

    it('creates and verifies authenticated Key Check Canary', async () => {
      const masterBytes = generateRandomMasterKeyBytes();
      const masterKey = await importMasterKey(masterBytes);

      const canary = await createKeyCheckValue(masterKey, 'ws-test-123');
      const isValid = await verifyKeyCheckValue(masterKey, canary, 'ws-test-123');
      expect(isValid).toBe(true);

      const wrongMasterKey = await importMasterKey(generateRandomMasterKeyBytes());
      const isInvalid = await verifyKeyCheckValue(wrongMasterKey, canary, 'ws-test-123');
      expect(isInvalid).toBe(false);
    });
  });

  // ── 3. Workspace Lifecycle, Creation, and Unlock ───────────────────────────
  describe('Workspace Service Integration', () => {
    it('creates, discovers, and unlocks multiple workspaces', async () => {
      // 1. Create Workspace A
      const resA = await workspaceService.createWorkspace({
        workspaceName: 'Engineering Workspace',
        displayName: 'Alice Engineer',
        password: 'PasswordA123!',
        iterations: TEST_ITERATIONS,
      });

      expect(resA.workspace.id).toBeDefined();
      expect(resA.recoveryKey.split(' ')).toHaveLength(24);

      // 2. Create Workspace B
      const resB = await workspaceService.createWorkspace({
        workspaceName: 'Product Workspace',
        displayName: 'Bob Manager',
        password: 'PasswordB123!',
        iterations: TEST_ITERATIONS,
      });

      expect(resB.workspace.id).toBeDefined();

      // 3. Discovery: List all local workspaces
      const list = await workspaceService.listWorkspaces();
      expect(list).toHaveLength(2);
      expect(list.map((w) => w.workspaceName)).toContain('Engineering Workspace');
      expect(list.map((w) => w.workspaceName)).toContain('Product Workspace');

      // 4. Unlock Workspace A with correct password
      const unlockedA = await workspaceService.unlockWithPassword(
        resA.workspace.id,
        'PasswordA123!'
      );
      expect(unlockedA.workspace.displayName).toBe('Alice Engineer');
      expect(keyManagementService.isUnlocked(resA.workspace.id)).toBe(true);

      // 5. Locking workspace clears memory
      workspaceService.lockWorkspace();
      expect(keyManagementService.isUnlocked()).toBe(false);
      expect(keyManagementService.getMasterKey()).toBeNull();
    });

    it('rejects creation of duplicate workspace name', async () => {
      await workspaceService.createWorkspace({
        workspaceName: 'Research Lab',
        displayName: 'Alice',
        password: 'Password123!',
        iterations: TEST_ITERATIONS,
      });

      await expect(
        workspaceService.createWorkspace({
          workspaceName: 'research lab',
          displayName: 'Alice Duplicate',
          password: 'Password123!',
          iterations: TEST_ITERATIONS,
        })
      ).rejects.toThrow(/already exists/i);
    });

    it('rejects incorrect password without leaking cryptographic details', async () => {
      const res = await workspaceService.createWorkspace({
        workspaceName: 'Security Vault',
        displayName: 'Carol',
        password: 'CorrectPassword123!',
        iterations: TEST_ITERATIONS,
      });

      // Explicitly lock workspace before testing failed unlock
      workspaceService.lockWorkspace();
      expect(keyManagementService.isUnlocked()).toBe(false);

      await expect(
        workspaceService.unlockWithPassword(res.workspace.id, 'WrongPassword999!')
      ).rejects.toThrow(/incorrect password/i);

      expect(keyManagementService.isUnlocked()).toBe(false);
    });

    it('unlocks successfully using 24-word recovery key', async () => {
      const res = await workspaceService.createWorkspace({
        workspaceName: 'Recovery Vault',
        displayName: 'David',
        password: 'OriginalPassword123!',
        iterations: TEST_ITERATIONS,
      });

      workspaceService.lockWorkspace();

      // Unlock via recovery mnemonic
      const unlocked = await workspaceService.unlockWithRecoveryKey(
        res.workspace.id,
        res.recoveryKey
      );

      expect(unlocked.workspace.displayName).toBe('David');
      expect(keyManagementService.isUnlocked(res.workspace.id)).toBe(true);
    });

    it('rejects invalid or wrong recovery phrase', async () => {
      const res = await workspaceService.createWorkspace({
        workspaceName: 'Vault X',
        displayName: 'Eve',
        password: 'Password123!',
        iterations: TEST_ITERATIONS,
      });

      const foreignMnemonic = await generateRecoveryMnemonic();

      await expect(
        workspaceService.unlockWithRecoveryKey(res.workspace.id, foreignMnemonic)
      ).rejects.toThrow();
    });

    it('performs secure password change without re-encrypting master key records', async () => {
      const res = await workspaceService.createWorkspace({
        workspaceName: 'Pass Change Test',
        displayName: 'Frank',
        password: 'OldPassword123!',
        iterations: TEST_ITERATIONS,
      });

      // Change password
      await workspaceService.changePassword(
        res.workspace.id,
        'OldPassword123!',
        'NewStrongPassword456!'
      );

      workspaceService.lockWorkspace();

      // Old password should fail
      await expect(
        workspaceService.unlockWithPassword(res.workspace.id, 'OldPassword123!')
      ).rejects.toThrow(/incorrect password/i);

      // New password succeeds
      const unlocked = await workspaceService.unlockWithPassword(
        res.workspace.id,
        'NewStrongPassword456!'
      );
      expect(unlocked.workspace.displayName).toBe('Frank');

      // Recovery key still works!
      workspaceService.lockWorkspace();
      const unlockedViaRecovery = await workspaceService.unlockWithRecoveryKey(
        res.workspace.id,
        res.recoveryKey
      );
      expect(unlockedViaRecovery.workspace.displayName).toBe('Frank');
    });
  });

  // ── 4. OPFS Storage Handling ──────────────────────────────────────────────
  describe('OPFS Foundation & Graceful Handling', () => {
    it('gracefully detects OPFS availability without crashing in non-browser environments', () => {
      const available = storageService.isAvailable();
      expect(typeof available).toBe('boolean');
    });

    it('handles storage quota queries safely', async () => {
      const quota = await storageService.getStorageQuota();
      expect(quota).toHaveProperty('usage');
      expect(quota).toHaveProperty('quota');
      expect(quota).toHaveProperty('percentUsed');
    });
  });

  // ── 5. Backup Export & Import (.voxora) ────────────────────────────────────
  describe('Encrypted Workspace Export & Import', () => {
    it('exports a workspace and imports it cleanly', async () => {
      const created = await workspaceService.createWorkspace({
        workspaceName: 'Export Target',
        displayName: 'Grace',
        password: 'BackupPassword123!',
        iterations: TEST_ITERATIONS,
      });

      // Export
      const blob = await backupService.exportWorkspace(created.workspace.id);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(100);

      // Clean database to simulate restoring to another device/session
      await db.workspaces.clear();
      await db.workspaceSettings.clear();
      await db.workspaceMetadata.clear();

      // Import
      const importResult = await backupService.importWorkspace(blob);
      expect(importResult.workspaceName).toBe('Export Target');

      // Verify unlocking with original password works on restored database
      const unlocked = await workspaceService.unlockWithPassword(
        importResult.workspaceId,
        'BackupPassword123!'
      );
      expect(unlocked.workspace.displayName).toBe('Grace');
    });

    it('handles duplicate workspace on import by renaming safely without overwrite', async () => {
      const created = await workspaceService.createWorkspace({
        workspaceName: 'Collision Test',
        displayName: 'Hank',
        password: 'Password123!',
        iterations: TEST_ITERATIONS,
      });

      const blob = await backupService.exportWorkspace(created.workspace.id);

      // Re-import while original still exists
      const importResult = await backupService.importWorkspace(blob, { renameOnConflict: true });
      expect(importResult.workspaceName).toBe('Collision Test (Imported)');
      expect(importResult.workspaceId).not.toEqual(created.workspace.id);

      // Both workspaces exist in database
      const all = await workspaceService.listWorkspaces();
      expect(all).toHaveLength(2);
    });

    it('rejects malformed or corrupted archive files', async () => {
      const badBlob = new Blob(['not a valid zip file'], { type: 'application/octet-stream' });
      await expect(backupService.importWorkspace(badBlob)).rejects.toThrow(/corrupt or invalid/i);
    });
  });

  // ── 6. 24-Hour Session Persistence & Auto-Restoration ────────────────────
  describe('24-Hour Session Persistence & Restoration', () => {
    it('saves and restores active workspace session across page refreshes', async () => {
      const created = await workspaceService.createWorkspace({
        workspaceName: 'Session Workspace',
        displayName: 'Raghav',
        password: 'Password123!',
        iterations: TEST_ITERATIONS,
      });

      // Simulate a browser page reload: clear ephemeral in-memory master key
      keyManagementService.clear();
      expect(keyManagementService.isUnlocked()).toBe(false);

      // Restore session
      const restored = await workspaceService.restoreSession();
      expect(restored).not.toBeNull();
      expect(restored.workspace.id).toBe(created.workspace.id);
      expect(restored.workspace.displayName).toBe('Raghav');
      expect(keyManagementService.isUnlocked()).toBe(true);
    });

    it('rejects and clears session if it exceeds the 24-hour expiration window', async () => {
      const created = await workspaceService.createWorkspace({
        workspaceName: 'Expired Session Workspace',
        displayName: 'Tester',
        password: 'Password123!',
        iterations: TEST_ITERATIONS,
      });

      // Artificially manipulate session expiration to simulate 25 hours passed
      const storage = getStorage();
      const rawSession = storage.getItem('voxora_active_session');
      expect(rawSession).toBeDefined();
      const parsed = JSON.parse(rawSession);
      parsed.expiresAt = Date.now() - 1000; // 1 second in the past
      storage.setItem('voxora_active_session', JSON.stringify(parsed));

      // Simulate page refresh
      keyManagementService.clear();

      const restored = await workspaceService.restoreSession();
      expect(restored).toBeNull();
      expect(keyManagementService.isUnlocked()).toBe(false);
      expect(storage.getItem('voxora_active_session')).toBeNull();
    });

    it('clears session permanently when lockWorkspace() is invoked', async () => {
      await workspaceService.createWorkspace({
        workspaceName: 'Explicit Lock Workspace',
        displayName: 'Tester',
        password: 'Password123!',
        iterations: TEST_ITERATIONS,
      });

      expect(sessionService.getSession()).not.toBeNull();

      // Explicit lock
      workspaceService.lockWorkspace();

      expect(sessionService.getSession()).toBeNull();
      expect(keyManagementService.isUnlocked()).toBe(false);
    });
  });
});

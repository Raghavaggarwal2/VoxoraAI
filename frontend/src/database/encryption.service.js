/**
 * Cryptographic and Envelope Encryption Service for Voxora AI.
 * 
 * Cryptographic Primitives:
 * - Master Key: 256-bit AES-GCM key generated using crypto.getRandomValues().
 * - Password Key Derivation: PBKDF2-HMAC-SHA-256 with 600,000 iterations (OWASP standard).
 *   [Trade-off Documentation]: Standard Web Crypto PBKDF2 with 600,000 iterations is natively
 *   implemented in all browsers (C++ hardware accelerated), avoids external untrusted WASM
 *   dependencies (which can crash in restricted CSP environments), and provides strong resistance
 *   to brute force attacks while maintaining broad cross-browser compatibility.
 * - Recovery Key Derivation: PBKDF2-HMAC-SHA-256 using 24-word BIP-39 mnemonic entropy.
 * - Authenticated Envelope Encryption: AES-256-GCM with fresh, unique 96-bit (12-byte) IVs
 *   and Additional Authenticated Data (AAD) binding records to workspace identity.
 */

const PBKDF2_ITERATIONS = 600000;
const AES_GCM_TAG_LENGTH = 128; // bits
const IV_LENGTH = 12; // bytes (96 bits recommended for AES-GCM)
const SALT_LENGTH = 16; // bytes (128 bits)

// ── Binary & Base64 Helpers ──────────────────────────────────────────────────

export function bufferToBase64(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Safely overwrites a byte array with zeroes.
 * Note: While this clears the specific typed array in JS heap, it does not guarantee
 * OS/engine-level memory scrubbing.
 */
export function wipeBytes(arr) {
  if (arr && arr.fill) {
    arr.fill(0);
  }
}

// ── Key Generation & Derivation ──────────────────────────────────────────────

/**
 * Generates a random 256-bit (32-byte) Master Key for workspace envelope encryption.
 */
export function generateRandomMasterKeyBytes() {
  const masterKeyBytes = new Uint8Array(32);
  crypto.getRandomValues(masterKeyBytes);
  return masterKeyBytes;
}

/**
 * Generates a random 16-byte salt for key derivation.
 */
export function generateSalt() {
  const salt = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(salt);
  return bufferToBase64(salt);
}

/**
 * Derives a 256-bit AES-GCM Key Encryption Key (KEK) from a password or passphrase
 * using PBKDF2-HMAC-SHA-256.
 */
export async function deriveKeyEncryptionKey(secretString, saltBase64, iterations = PBKDF2_ITERATIONS) {
  const enc = new TextEncoder();
  const secretKeyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(secretString),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const saltBytes = base64ToBuffer(saltBase64);

  const kek = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations,
      hash: 'SHA-256',
    },
    secretKeyMaterial,
    { name: 'AES-GCM', length: 256 },
    false, // KEK is not exportable
    ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
  );

  return kek;
}

/**
 * Imports raw master key bytes into an active AES-GCM CryptoKey for workspace encryption.
 */
export async function importMasterKey(masterKeyBytes) {
  return crypto.subtle.importKey(
    'raw',
    masterKeyBytes,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// ── Envelope Wrapping & Unwrapping ───────────────────────────────────────────

/**
 * Wraps (encrypts) the raw 32-byte master key using a KEK with AES-256-GCM and AAD.
 */
export async function wrapMasterKey(masterKeyBytes, kek, workspaceId, envelopeType = 'password') {
  const iv = new Uint8Array(IV_LENGTH);
  crypto.getRandomValues(iv);

  const aad = new TextEncoder().encode(`voxora:wrap:${envelopeType}:${workspaceId}`);

  const rawMasterKeyCrypto = await crypto.subtle.importKey(
    'raw',
    masterKeyBytes,
    { name: 'AES-GCM' },
    true, // exportable for wrapKey
    ['encrypt', 'decrypt']
  );

  const wrappedBuffer = await crypto.subtle.wrapKey(
    'raw',
    rawMasterKeyCrypto,
    kek,
    {
      name: 'AES-GCM',
      iv,
      additionalData: aad,
      tagLength: AES_GCM_TAG_LENGTH,
    }
  );

  return {
    ciphertext: bufferToBase64(wrappedBuffer),
    iv: bufferToBase64(iv),
    envelopeType,
  };
}

/**
 * Unwraps (decrypts) the master key from its envelope using the provided KEK.
 * Throws an OperationError if the password/recovery key is incorrect.
 */
export async function unwrapMasterKey(envelope, kek, workspaceId) {
  const iv = base64ToBuffer(envelope.iv);
  const wrappedBuffer = base64ToBuffer(envelope.ciphertext);
  const aad = new TextEncoder().encode(`voxora:wrap:${envelope.envelopeType || 'password'}:${workspaceId}`);

  const unwrappedCryptoKey = await crypto.subtle.unwrapKey(
    'raw',
    wrappedBuffer,
    kek,
    {
      name: 'AES-GCM',
      iv,
      additionalData: aad,
      tagLength: AES_GCM_TAG_LENGTH,
    },
    { name: 'AES-GCM', length: 256 },
    true, // exportable temporarily to verify bytes / cache master key in memory
    ['encrypt', 'decrypt']
  );

  const rawBytes = await crypto.subtle.exportKey('raw', unwrappedCryptoKey);
  return new Uint8Array(rawBytes);
}

// ── Record Encryption & Decryption ───────────────────────────────────────────

/**
 * Encrypts arbitrary serializable data using the Master Key and AES-256-GCM.
 * Generates a fresh, unique 12-byte IV for every encryption call.
 */
export async function encryptData(masterKey, data, aadString = '') {
  const iv = new Uint8Array(IV_LENGTH);
  crypto.getRandomValues(iv);

  const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
  const plaintext = new TextEncoder().encode(jsonStr);
  const aad = aadString ? new TextEncoder().encode(aadString) : undefined;

  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      additionalData: aad,
      tagLength: AES_GCM_TAG_LENGTH,
    },
    masterKey,
    plaintext
  );

  return {
    ciphertext: bufferToBase64(ciphertextBuffer),
    iv: bufferToBase64(iv),
    aad: aadString || undefined,
  };
}

/**
 * Decrypts an encrypted payload using the Master Key.
 * Throws if authentication tag does not verify (tampering or corrupted key).
 */
export async function decryptData(masterKey, encryptedPayload) {
  const iv = base64ToBuffer(encryptedPayload.iv);
  const ciphertext = base64ToBuffer(encryptedPayload.ciphertext);
  const aad = encryptedPayload.aad ? new TextEncoder().encode(encryptedPayload.aad) : undefined;

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
      additionalData: aad,
      tagLength: AES_GCM_TAG_LENGTH,
    },
    masterKey,
    ciphertext
  );

  const jsonStr = new TextDecoder().decode(decryptedBuffer);
  try {
    return JSON.parse(jsonStr);
  } catch {
    return jsonStr;
  }
}

// ── Key Check Canary ─────────────────────────────────────────────────────────

export const CANARY_RECORD_TEXT = 'VOXORA_KEY_CHECK_OK';

/**
 * Creates an authenticated canary record encrypted with the master key to verify
 * valid unlocking without leaking keys or decrypting user data.
 */
export async function createKeyCheckValue(masterKey, workspaceId) {
  return encryptData(masterKey, { canary: CANARY_RECORD_TEXT, workspaceId }, `voxora:kcv:${workspaceId}`);
}

/**
 * Verifies that the unwrapped master key successfully decrypts the canary.
 */
export async function verifyKeyCheckValue(masterKey, keyCheckValue, workspaceId) {
  try {
    const decrypted = await decryptData(masterKey, keyCheckValue);
    return decrypted && decrypted.canary === CANARY_RECORD_TEXT && decrypted.workspaceId === workspaceId;
  } catch {
    return false;
  }
}


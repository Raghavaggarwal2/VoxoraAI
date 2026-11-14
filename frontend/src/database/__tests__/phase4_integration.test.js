import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../db';
import { dataRepository } from '../data.repository';
import { CURRENT_SCHEMA_VERSION } from '../schema';
import { keyManagementService } from '../key-management.service';
import {
  generateRandomMasterKeyBytes,
  importMasterKey,
} from '../encryption.service';

describe('Voxora AI — Phase 4: AI Backend Integration & Encrypted Intelligence Tests', () => {
  const wsA = 'ws-test-alpha';
  const wsB = 'ws-test-beta';

  let masterKeyA;
  let masterKeyB;

  beforeEach(async () => {
    // Clear all tables
    await db.workspaces.clear();
    await db.analyses.clear();
    await db.collections.clear();
    await db.analysisCollections.clear();
    await db.mediaFiles.clear();
    await db.analysisResults.clear();
    await db.analysisChats.clear();

    // Generate active master key for wsA
    const rawKeyA = generateRandomMasterKeyBytes();
    masterKeyA = await importMasterKey(rawKeyA);
    keyManagementService.setMasterKey(wsA, masterKeyA, rawKeyA);

    // Generate master key for wsB
    const rawKeyB = generateRandomMasterKeyBytes();
    masterKeyB = await importMasterKey(rawKeyB);
  });

  afterEach(() => {
    keyManagementService.clear();
  });

  // ── 1. Schema & Versioning ────────────────────────────────────────────────
  it('confirms database schema version 3 upgrade and table presence', () => {
    expect(CURRENT_SCHEMA_VERSION).toBe(3);
    expect(db.analysisResults).toBeDefined();
    expect(db.analysisChats).toBeDefined();
    expect(db.analyses).toBeDefined();
  });

  // ── 2. Encrypted Analysis Results Persistence & Zero-Plaintext Storage ───
  it('persists AI analysis results with AES-256-GCM encryption and zero plaintext at rest', async () => {
    const analysis = await dataRepository.createAnalysis({
      workspaceId: wsA,
      title: 'AI Systems Architecture Keynote',
      mediaType: 'video',
      filename: 'keynote.mp4',
    });

    const mockAiResults = {
      title: 'AI Systems Architecture Keynote',
      summary: 'Executive overview of multi-agent distributed architecture.',
      action_items: '- [ ] Deploy vector stores\n- [ ] Benchmark latency',
      key_decisions: '1. Use local HuggingFace embeddings\n2. Maintain local-first OPFS storage',
      questions: '1. What is the memory footprint on low-end machines?',
      mindmap: 'graph TD\n  A[Frontend] --> B[FastAPI]\n  B --> C[Groq Whisper]',
      word_count: 850,
    };

    const mockTranscriptData = {
      transcript: 'Full media speech transcript with deep technical analysis...',
      word_count: 850,
    };

    // Save encrypted results
    await dataRepository.saveEncryptedResults(analysis.id, wsA, {
      results: mockAiResults,
      transcriptData: mockTranscriptData,
    });

    // 1. Verify directly in IndexedDB table that stored payload is encrypted
    const rawStoredRecord = await db.analysisResults.get(analysis.id);
    expect(rawStoredRecord).toBeDefined();
    expect(rawStoredRecord.analysisId).toBe(analysis.id);
    expect(rawStoredRecord.workspaceId).toBe(wsA);

    // Check that sensitive intelligence text does NOT exist as raw plaintext
    expect(rawStoredRecord.summary).toBeUndefined();
    expect(rawStoredRecord.transcript).toBeUndefined();
    expect(rawStoredRecord.encryptedPayload).toBeDefined();
    expect(typeof rawStoredRecord.encryptedPayload.ciphertext).toBe('string');
    expect(typeof rawStoredRecord.encryptedPayload.iv).toBe('string');
    expect(rawStoredRecord.encryptedPayload.aad).toBe(`voxora:results:${wsA}:${analysis.id}`);

    // 2. Decrypt with active master key
    const decrypted = await dataRepository.getDecryptedResults(analysis.id, wsA);
    expect(decrypted).toBeDefined();
    expect(decrypted.results.summary).toBe(mockAiResults.summary);
    expect(decrypted.results.action_items).toBe(mockAiResults.action_items);
    expect(decrypted.results.mindmap).toBe(mockAiResults.mindmap);
    expect(decrypted.transcriptData.transcript).toBe(mockTranscriptData.transcript);
  });

  // ── 3. Locked Workspace Decryption Security ───────────────────────────────
  it('blocks results decryption when the workspace is locked', async () => {
    const analysis = await dataRepository.createAnalysis({
      workspaceId: wsA,
      title: 'Confidential Strategy Session',
      mediaType: 'audio',
    });

    await dataRepository.saveEncryptedResults(analysis.id, wsA, {
      secretData: 'Highly classified executive transcript',
    });

    // Lock workspace
    keyManagementService.clear();

    // Attempting to decrypt must throw an error
    await expect(dataRepository.getDecryptedResults(analysis.id, wsA)).rejects.toThrow(
      'Workspace is locked'
    );
  });

  // ── 4. Encrypted Chat Message Storage & Retrieval ─────────────────────────
  it('stores and retrieves chronological encrypted chat messages with sources', async () => {
    const analysis = await dataRepository.createAnalysis({
      workspaceId: wsA,
      title: 'Lecture: LLMs and RAG',
      mediaType: 'video',
    });

    // User message
    const userMsg = await dataRepository.saveEncryptedChatMessage(analysis.id, wsA, {
      role: 'user',
      text: 'What embedding model is used?',
    });

    // Assistant response with source chunks
    const assistantMsg = await dataRepository.saveEncryptedChatMessage(analysis.id, wsA, {
      role: 'assistant',
      text: 'The pipeline uses all-MiniLM-L6-v2 embeddings stored in local ChromaDB.',
      sources: [
        'Local HuggingFace embeddings: sentence-transformers/all-MiniLM-L6-v2',
        'Vector store persists chunks into vector_db directory',
      ],
    });

    // 1. Verify in raw IndexedDB that chat messages are encrypted
    const rawChats = await db.analysisChats.where('analysisId').equals(analysis.id).toArray();
    expect(rawChats).toHaveLength(2);
    expect(rawChats[0].text).toBeUndefined();
    expect(rawChats[0].encryptedPayload).toBeDefined();
    expect(rawChats[0].encryptedPayload.ciphertext).toBeDefined();

    // 2. Retrieve decrypted messages
    const decryptedChat = await dataRepository.getDecryptedChatMessages(analysis.id, wsA);
    expect(decryptedChat).toHaveLength(2);
    expect(decryptedChat[0].role).toBe('user');
    expect(decryptedChat[0].text).toBe('What embedding model is used?');
    expect(decryptedChat[1].role).toBe('assistant');
    expect(decryptedChat[1].text).toContain('all-MiniLM-L6-v2');
    expect(decryptedChat[1].sources).toHaveLength(2);
    expect(decryptedChat[1].sources[0]).toContain('sentence-transformers');

    // 3. Clear chat messages
    await dataRepository.clearChatMessages(analysis.id, wsA);
    const clearedChat = await dataRepository.getDecryptedChatMessages(analysis.id, wsA);
    expect(clearedChat).toHaveLength(0);
  });

  // ── 5. Cascading Deletion of Analysis Records, Results, and Chats ─────────
  it('atomically removes analysis record, relations, encrypted results, and chat history upon deletion', async () => {
    const analysis = await dataRepository.createAnalysis({
      workspaceId: wsA,
      title: 'Analysis to be Deleted',
      mediaType: 'video',
    });

    // Add result and chat
    await dataRepository.saveEncryptedResults(analysis.id, wsA, { summary: 'Sample summary' });
    await dataRepository.saveEncryptedChatMessage(analysis.id, wsA, { role: 'user', text: 'Hello' });

    // Verify existing
    expect(await db.analyses.get(analysis.id)).toBeDefined();
    expect(await db.analysisResults.get(analysis.id)).toBeDefined();
    expect(await db.analysisChats.where('analysisId').equals(analysis.id).count()).toBe(1);

    // Delete analysis
    await dataRepository.deleteAnalysis(analysis.id, wsA);

    // Confirm cascading cleanup
    expect(await db.analyses.get(analysis.id)).toBeUndefined();
    expect(await db.analysisResults.get(analysis.id)).toBeUndefined();
    expect(await db.analysisChats.where('analysisId').equals(analysis.id).count()).toBe(0);
  });

  // ── 6. Cross-Workspace Data Isolation ─────────────────────────────────────
  it('strictly isolates encrypted results between distinct workspaces', async () => {
    const analysisA = await dataRepository.createAnalysis({
      workspaceId: wsA,
      title: 'Workspace A Document',
    });

    await dataRepository.saveEncryptedResults(analysisA.id, wsA, { data: 'Secret A' });

    // Attempt to access from Workspace B
    const resultFromB = await dataRepository.getDecryptedResults(analysisA.id, wsB);
    expect(resultFromB).toBeNull();
  });
});


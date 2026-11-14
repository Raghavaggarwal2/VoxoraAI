import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db';
import { dataRepository } from '../data.repository';
import { CURRENT_SCHEMA_VERSION } from '../schema';

describe('Voxora AI — Phase 3: Dashboard & Local Data Management Tests', () => {
  const wsA = 'ws-test-alpha';
  const wsB = 'ws-test-beta';

  beforeEach(async () => {
    await db.workspaces.clear();
    await db.analyses.clear();
    await db.collections.clear();
    await db.analysisCollections.clear();
    await db.mediaFiles.clear();
  });

  // ── 1. Schema & Versioning ────────────────────────────────────────────────
  it('confirms database schema version 2 upgrade and table presence', () => {
    expect(CURRENT_SCHEMA_VERSION).toBeGreaterThanOrEqual(2);
    expect(db.analyses).toBeDefined();
    expect(db.collections).toBeDefined();
    expect(db.analysisCollections).toBeDefined();
    expect(db.workspaces).toBeDefined();
    expect(db.mediaFiles).toBeDefined();
  });

  // ── 2. Analysis Creation & Scope Isolation ────────────────────────────────
  it('creates analysis records scoped strictly to the active workspace', async () => {
    const analysisA = await dataRepository.createAnalysis({
      workspaceId: wsA,
      title: 'Alpha Keynote Video',
      description: 'Opening remarks',
      mediaType: 'video',
      filename: 'keynote.mp4',
      fileSize: 1048576, // 1 MB
    });

    expect(analysisA.id).toBeDefined();
    expect(analysisA.workspaceId).toBe(wsA);
    expect(analysisA.status).toBe('ready');
    expect(analysisA.isSaved).toBe(false);

    // Create analysis in Workspace B
    await dataRepository.createAnalysis({
      workspaceId: wsB,
      title: 'Beta Audio Interview',
      mediaType: 'audio',
      filename: 'interview.wav',
    });

    // Query Workspace A
    const listA = await dataRepository.getAnalysesByWorkspace(wsA);
    expect(listA).toHaveLength(1);
    expect(listA[0].title).toBe('Alpha Keynote Video');

    // Query Workspace B
    const listB = await dataRepository.getAnalysesByWorkspace(wsB);
    expect(listB).toHaveLength(1);
    expect(listB[0].title).toBe('Beta Audio Interview');
  });

  it('rejects analysis creation without required fields', async () => {
    await expect(
      dataRepository.createAnalysis({ workspaceId: '', title: 'Test' })
    ).rejects.toThrow(/workspace id is required/i);

    await expect(
      dataRepository.createAnalysis({ workspaceId: wsA, title: '' })
    ).rejects.toThrow(/title is required/i);
  });

  // ── 3. Search, Filter, and Sort ───────────────────────────────────────────
  it('searches and filters analyses by title, mediaType, status, and sort order', async () => {
    await dataRepository.createAnalysis({
      workspaceId: wsA,
      title: 'AI Product Roadmap',
      mediaType: 'video',
    });
    await dataRepository.createAnalysis({
      workspaceId: wsA,
      title: 'Engineering Standup',
      mediaType: 'audio',
    });
    const completedAnalysis = await dataRepository.createAnalysis({
      workspaceId: wsA,
      title: 'Customer Feedback Session',
      mediaType: 'video',
    });
    await dataRepository.updateAnalysis(completedAnalysis.id, wsA, { status: 'completed' });

    // Search by keyword
    const searched = await dataRepository.getAnalysesByWorkspace(wsA, { search: 'Roadmap' });
    expect(searched).toHaveLength(1);
    expect(searched[0].title).toBe('AI Product Roadmap');

    // Filter by mediaType
    const audioOnly = await dataRepository.getAnalysesByWorkspace(wsA, { mediaType: 'audio' });
    expect(audioOnly).toHaveLength(1);
    expect(audioOnly[0].title).toBe('Engineering Standup');

    // Filter by status
    const completedOnly = await dataRepository.getAnalysesByWorkspace(wsA, { status: 'completed' });
    expect(completedOnly).toHaveLength(1);
    expect(completedOnly[0].title).toBe('Customer Feedback Session');

    // Sort title-asc
    const sorted = await dataRepository.getAnalysesByWorkspace(wsA, { sort: 'title-asc' });
    expect(sorted[0].title).toBe('AI Product Roadmap');
    expect(sorted[1].title).toBe('Customer Feedback Session');
    expect(sorted[2].title).toBe('Engineering Standup');
  });

  // ── 4. Saved / Bookmark State Persistence ─────────────────────────────────
  it('toggles saved state and persists across queries', async () => {
    const item = await dataRepository.createAnalysis({
      workspaceId: wsA,
      title: 'Important Lecture',
      mediaType: 'video',
    });
    expect(item.isSaved).toBe(false);

    // Toggle save to true
    const savedState1 = await dataRepository.toggleSaveAnalysis(item.id, wsA);
    expect(savedState1).toBe(true);

    const savedList = await dataRepository.getAnalysesByWorkspace(wsA, { isSaved: true });
    expect(savedList).toHaveLength(1);
    expect(savedList[0].id).toBe(item.id);

    // Toggle save back to false
    const savedState2 = await dataRepository.toggleSaveAnalysis(item.id, wsA);
    expect(savedState2).toBe(false);

    const emptySaved = await dataRepository.getAnalysesByWorkspace(wsA, { isSaved: true });
    expect(emptySaved).toHaveLength(0);
  });

  // ── 5. Atomic Deletion of Analyses ────────────────────────────────────────
  it('atomically deletes analysis and removes its collection relations', async () => {
    const analysis = await dataRepository.createAnalysis({
      workspaceId: wsA,
      title: 'Deletable Recording',
      mediaType: 'audio',
    });

    const collection = await dataRepository.createCollection({
      workspaceId: wsA,
      name: 'Temp Collection',
    });

    await dataRepository.addAnalysisToCollection(analysis.id, collection.id, wsA);

    // Verify relation exists
    const beforeDel = await dataRepository.getAnalysesInCollection(collection.id, wsA);
    expect(beforeDel).toHaveLength(1);

    // Delete analysis
    await dataRepository.deleteAnalysis(analysis.id, wsA);

    // Verify analysis is removed from DB
    const fetched = await dataRepository.getAnalysisById(analysis.id, wsA);
    expect(fetched).toBeNull();

    // Verify relation was automatically removed
    const afterDel = await dataRepository.getAnalysesInCollection(collection.id, wsA);
    expect(afterDel).toHaveLength(0);

    // Verify collection still exists
    const colAfter = await dataRepository.getCollectionById(collection.id, wsA);
    expect(colAfter).not.toBeNull();
  });

  // ── 6. Real Workspace Dashboard Statistics ────────────────────────────────
  it('computes real workspace stats with zero default and accurate aggregation', async () => {
    // Empty workspace returns 0
    const emptyStats = await dataRepository.getWorkspaceStats('empty-ws');
    expect(emptyStats).toEqual({
      totalAnalyses: 0,
      completedAnalyses: 0,
      savedAnalyses: 0,
      totalCollections: 0,
      storageBytes: 0,
    });

    // Populate Workspace A
    const a1 = await dataRepository.createAnalysis({
      workspaceId: wsA,
      title: 'Analysis 1',
      mediaType: 'video',
    });
    const a2 = await dataRepository.createAnalysis({
      workspaceId: wsA,
      title: 'Analysis 2',
      mediaType: 'audio',
    });

    await dataRepository.updateAnalysis(a1.id, wsA, { status: 'completed' });
    await dataRepository.toggleSaveAnalysis(a2.id, wsA);

    await dataRepository.createCollection({ workspaceId: wsA, name: 'Research' });
    await dataRepository.createCollection({ workspaceId: wsA, name: 'Archive' });

    // Register media file size
    await db.mediaFiles.add({
      id: 'media-1',
      workspaceId: wsA,
      filename: 'sample.mp4',
      size: 5242880, // 5 MB
      mimeType: 'video/mp4',
      createdAt: new Date().toISOString(),
    });

    const stats = await dataRepository.getWorkspaceStats(wsA);
    expect(stats.totalAnalyses).toBe(2);
    expect(stats.completedAnalyses).toBe(1);
    expect(stats.savedAnalyses).toBe(1);
    expect(stats.totalCollections).toBe(2);
    expect(stats.storageBytes).toBe(5242880);
  });

  // ── 7. Collections CRUD & Name Uniqueness ─────────────────────────────────
  describe('Collections Management', () => {
    it('creates collections and enforces case-insensitive name uniqueness within workspace', async () => {
      const col = await dataRepository.createCollection({
        workspaceId: wsA,
        name: 'Weekly Syncs',
        description: 'Team meeting recordings',
      });

      expect(col.name).toBe('Weekly Syncs');

      // Attempt duplicate name with different casing in same workspace
      await expect(
        dataRepository.createCollection({
          workspaceId: wsA,
          name: 'weekly syncs',
        })
      ).rejects.toThrow(/already exists/i);

      // Same name in different workspace (wsB) is allowed!
      const colB = await dataRepository.createCollection({
        workspaceId: wsB,
        name: 'Weekly Syncs',
      });
      expect(colB.workspaceId).toBe(wsB);
    });

    it('updates collection name and enforces uniqueness upon rename', async () => {
      const col1 = await dataRepository.createCollection({ workspaceId: wsA, name: 'Project X' });
      const col2 = await dataRepository.createCollection({ workspaceId: wsA, name: 'Project Y' });

      // Rename to existing name should fail
      await expect(
        dataRepository.updateCollection(col2.id, wsA, { name: 'project x' })
      ).rejects.toThrow(/already exists/i);

      // Rename to valid new name succeeds
      const updated = await dataRepository.updateCollection(col2.id, wsA, { name: 'Project Z' });
      expect(updated.name).toBe('Project Z');
    });

    it('manages many-to-many analysis-to-collection relations with accurate counts', async () => {
      const col = await dataRepository.createCollection({ workspaceId: wsA, name: 'Sprint 42' });
      const a1 = await dataRepository.createAnalysis({ workspaceId: wsA, title: 'Demo 1' });
      const a2 = await dataRepository.createAnalysis({ workspaceId: wsA, title: 'Demo 2' });

      await dataRepository.addAnalysisToCollection(a1.id, col.id, wsA);
      await dataRepository.addAnalysisToCollection(a2.id, col.id, wsA);

      const itemsInCol = await dataRepository.getAnalysesInCollection(col.id, wsA);
      expect(itemsInCol).toHaveLength(2);

      const list = await dataRepository.getCollectionsByWorkspace(wsA);
      expect(list[0].analysisCount).toBe(2);

      // Remove one analysis
      await dataRepository.removeAnalysisFromCollection(a1.id, col.id, wsA);
      const itemsAfterRemove = await dataRepository.getAnalysesInCollection(col.id, wsA);
      expect(itemsAfterRemove).toHaveLength(1);
      expect(itemsAfterRemove[0].id).toBe(a2.id);
    });

    it('deleting a collection does NOT delete underlying analyses', async () => {
      const col = await dataRepository.createCollection({ workspaceId: wsA, name: 'To Delete' });
      const analysis = await dataRepository.createAnalysis({ workspaceId: wsA, title: 'Preserved Video' });

      await dataRepository.addAnalysisToCollection(analysis.id, col.id, wsA);

      await dataRepository.deleteCollection(col.id, wsA);

      // Collection is gone
      const fetchedCol = await dataRepository.getCollectionById(col.id, wsA);
      expect(fetchedCol).toBeNull();

      // Analysis still exists!
      const fetchedAnalysis = await dataRepository.getAnalysisById(analysis.id, wsA);
      expect(fetchedAnalysis).not.toBeNull();
      expect(fetchedAnalysis.title).toBe('Preserved Video');
    });
  });
});


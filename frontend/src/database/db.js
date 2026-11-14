import Dexie from 'dexie';
import { DB_NAME, SCHEMA_V1, SCHEMA_V2, SCHEMA_V3 } from './schema';

/**
 * Voxora AI Dexie Database class with versioning and upgrade paths.
 */
export class VoxoraDatabase extends Dexie {
  constructor(dbName = DB_NAME) {
    super(dbName);

    // Schema v1 (Phase 1 & 2 baseline)
    this.version(1).stores(SCHEMA_V1);

    // Schema v2 (Phase 3: Analyses, Collections, and Collection Relations)
    this.version(2).stores(SCHEMA_V2);

    // Schema v3 (Phase 4: Encrypted Analysis Results and Persistent Chat)
    this.version(3).stores(SCHEMA_V3);

    // Typed table references
    this.workspaces = this.table('workspaces');
    this.workspaceSettings = this.table('workspaceSettings');
    this.workspaceMetadata = this.table('workspaceMetadata');
    this.mediaFiles = this.table('mediaFiles');
    this.analyses = this.table('analyses');
    this.collections = this.table('collections');
    this.analysisCollections = this.table('analysisCollections');
    this.analysisResults = this.table('analysisResults');
    this.analysisChats = this.table('analysisChats');
  }
}

// Singleton database instance for standard application runtime
export const db = new VoxoraDatabase();

/**
 * Voxora AI IndexedDB Schema Definitions using Dexie.js.
 */

export const DB_NAME = 'VoxoraWorkspaceDB';
export const CURRENT_SCHEMA_VERSION = 3;

export const SCHEMA_V1 = {
  workspaces: '&id, workspaceName, createdAt, updatedAt',
  workspaceSettings: '&id, workspaceId, updatedAt',
  workspaceMetadata: '&id, workspaceId, updatedAt',
  mediaFiles: '&id, workspaceId, filename, mimeType, createdAt',
};

export const SCHEMA_V2 = {
  ...SCHEMA_V1,
  analyses: '&id, workspaceId, title, mediaType, status, isSaved, createdAt, updatedAt',
  collections: '&id, workspaceId, name, createdAt, updatedAt',
  analysisCollections: '&id, workspaceId, analysisId, collectionId, [analysisId+collectionId]',
};

export const SCHEMA_V3 = {
  ...SCHEMA_V2,
  analysisResults: '&analysisId, workspaceId, updatedAt',
  analysisChats: '&id, workspaceId, analysisId, createdAt',
};

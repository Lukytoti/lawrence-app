'use server';

import {
  createDocument,
  updateDocumentMetadata,
  archiveDocument,
  restoreDocument,
  getDocument,
  listDocuments,
  moveDocument,
  deleteDocument,
  getDocumentHistory,
  addDocumentRelation,
  getDocumentsByRelation,
  getDocumentsDashboardOverview,
} from './service';
import {
  createDocumentVersion,
  getDocumentVersion,
  listDocumentVersions,
  compareVersions,
  restoreVersion,
} from './versions';
import {
  createFolder,
  renameFolder,
  moveFolder,
  listFolderContents,
  deleteFolder,
} from './folders';
import {
  shareDocument,
  revokeShare,
  getActiveShares,
  validateShare,
} from './sharing';
import {
  requestApproval,
  approveDocument,
  rejectDocument,
  cancelApproval,
  getApprovalHistory,
} from './approvals';
import {
  createKnowledgeCollection,
  createKnowledgeEntry,
  updateKnowledgeEntry,
  submitKnowledgeForReview,
  publishKnowledgeEntry,
  archiveKnowledgeEntry,
  searchKnowledge,
  getPublishedKnowledge,
  getAuthorizedKnowledgeChunks,
} from './knowledge';
import {
  createRetentionPolicy,
  listRetentionPolicies,
  placeLegalHold,
  releaseLegalHold,
  listLegalHolds,
  evaluateRetention,
  executeAutomatedRetention,
} from './retention';
import { DOCUMENT_PERMISSIONS, hasDocumentPermission } from './permissions';
import { sanitizeForAudit } from './security';

// ---------------------------------------------------------------------------
// Document Server Actions
// ---------------------------------------------------------------------------
export async function createDocumentAction(input: any, actorUserId: string) {
  const res = await createDocument(input, actorUserId);
  return sanitizeForAudit(res);
}

export async function updateDocumentMetadataAction(documentId: string, input: any, actorUserId: string) {
  const res = await updateDocumentMetadata(documentId, input, actorUserId);
  return sanitizeForAudit(res);
}

export async function archiveDocumentAction(documentId: string, actorUserId: string) {
  const res = await archiveDocument(documentId, actorUserId);
  return sanitizeForAudit(res);
}

export async function restoreDocumentAction(documentId: string, actorUserId: string) {
  const res = await restoreDocument(documentId, actorUserId);
  return sanitizeForAudit(res);
}

export async function getDocumentAction(documentId: string, actorUserId: string) {
  const res = await getDocument(documentId, actorUserId);
  return sanitizeForAudit(res);
}

export async function listDocumentsAction(filters: any, actorUserId: string) {
  const res = await listDocuments(filters, actorUserId);
  return sanitizeForAudit(res);
}

export async function moveDocumentAction(documentId: string, targetFolderId: string | null, actorUserId: string) {
  const res = await moveDocument(documentId, targetFolderId, actorUserId);
  return sanitizeForAudit(res);
}

export async function deleteDocumentAction(documentId: string, actorUserId: string) {
  const res = await deleteDocument(documentId, actorUserId);
  return sanitizeForAudit(res);
}

export async function getDocumentHistoryAction(documentId: string, actorUserId: string) {
  const res = await getDocumentHistory(documentId, actorUserId);
  return sanitizeForAudit(res);
}

export async function getDocumentsDashboardOverviewAction(actorUserId: string) {
  const res = await getDocumentsDashboardOverview(actorUserId);
  return sanitizeForAudit(res);
}

// ---------------------------------------------------------------------------
// Version Server Actions
// ---------------------------------------------------------------------------
export async function createDocumentVersionAction(input: any, actorUserId: string) {
  const res = await createDocumentVersion(input, actorUserId);
  return sanitizeForAudit(res);
}

export async function listDocumentVersionsAction(documentId: string, actorUserId: string) {
  const res = await listDocumentVersions(documentId, actorUserId);
  return sanitizeForAudit(res);
}

export async function restoreVersionAction(documentId: string, sourceVersionId: string, actorUserId: string) {
  const res = await restoreVersion(documentId, sourceVersionId, actorUserId);
  return sanitizeForAudit(res);
}

// ---------------------------------------------------------------------------
// Folder Server Actions
// ---------------------------------------------------------------------------
export async function createFolderAction(input: any, actorUserId: string) {
  const res = await createFolder(input, actorUserId);
  return sanitizeForAudit(res);
}

export async function renameFolderAction(folderId: string, name: string, actorUserId: string) {
  const res = await renameFolder(folderId, name, actorUserId);
  return sanitizeForAudit(res);
}

export async function listFolderContentsAction(folderId: string | null, actorUserId: string) {
  const res = await listFolderContents(folderId, actorUserId);
  return sanitizeForAudit(res);
}

export async function moveFolderAction(folderId: string, targetParentFolderId: string | null, actorUserId: string) {
  const res = await moveFolder(folderId, targetParentFolderId, actorUserId);
  return sanitizeForAudit(res);
}

export async function deleteFolderAction(folderId: string, actorUserId: string) {
  const res = await deleteFolder(folderId, actorUserId);
  return sanitizeForAudit(res);
}

// ---------------------------------------------------------------------------
// Sharing & Approval Actions
// ---------------------------------------------------------------------------
export async function shareDocumentAction(input: any, actorUserId: string) {
  const res = await shareDocument(input, actorUserId);
  return sanitizeForAudit(res);
}

export async function revokeShareAction(shareId: string, actorUserId: string) {
  const res = await revokeShare(shareId, actorUserId);
  return sanitizeForAudit(res);
}

export async function requestApprovalAction(input: any, actorUserId: string) {
  const res = await requestApproval(input, actorUserId);
  return sanitizeForAudit(res);
}

export async function approveDocumentAction(approvalId: string, comments: string | undefined, reviewerUserId: string) {
  const res = await approveDocument(approvalId, comments, reviewerUserId);
  return sanitizeForAudit(res);
}

export async function rejectDocumentAction(approvalId: string, comments: string, reviewerUserId: string) {
  const res = await rejectDocument(approvalId, comments, reviewerUserId);
  return sanitizeForAudit(res);
}

// ---------------------------------------------------------------------------
// Knowledge Actions
// ---------------------------------------------------------------------------
export async function createKnowledgeCollectionAction(input: any, actorUserId: string) {
  const res = await createKnowledgeCollection(input, actorUserId);
  return sanitizeForAudit(res);
}

export async function createKnowledgeEntryAction(input: any, actorUserId: string) {
  const res = await createKnowledgeEntry(input, actorUserId);
  return sanitizeForAudit(res);
}

export async function updateKnowledgeEntryAction(entryId: string, data: any, actorUserId: string) {
  const res = await updateKnowledgeEntry(entryId, data, actorUserId);
  return sanitizeForAudit(res);
}

export async function publishKnowledgeEntryAction(entryId: string, approvedByUserId: string) {
  const res = await publishKnowledgeEntry(entryId, approvedByUserId);
  return sanitizeForAudit(res);
}

export async function searchKnowledgeAction(query: string, collectionId?: string) {
  const res = await searchKnowledge(query, collectionId, false);
  return sanitizeForAudit(res);
}

// ---------------------------------------------------------------------------
// Retention & Legal Hold Actions
// ---------------------------------------------------------------------------
export async function placeLegalHoldAction(input: any, actorUserId: string) {
  const res = await placeLegalHold(input, actorUserId);
  return sanitizeForAudit(res);
}

export async function releaseLegalHoldAction(holdId: string, actorUserId: string) {
  const res = await releaseLegalHold(holdId, actorUserId);
  return sanitizeForAudit(res);
}

export async function listLegalHoldsAction(documentId?: string) {
  const res = await listLegalHolds(documentId);
  return sanitizeForAudit(res);
}

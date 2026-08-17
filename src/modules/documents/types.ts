/**
 * Type definitions, Enums, DTOs for Module 21: Enterprise Document, Knowledge & Records Management Engine.
 */

export type DocumentType =
  | 'GENERAL'
  | 'CONTRACT'
  | 'POLICY'
  | 'PROCEDURE'
  | 'REPORT'
  | 'INVOICE'
  | 'RECEIPT'
  | 'PROPOSAL'
  | 'TRAINING'
  | 'MEETING'
  | 'PROJECT'
  | 'CRM'
  | 'LEGAL'
  | 'COMPLIANCE'
  | 'KNOWLEDGE'
  | 'OTHER';

export type DocumentStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'ARCHIVED'
  | 'DELETED';

export type DocumentClassification =
  | 'PUBLIC'
  | 'INTERNAL'
  | 'CONFIDENTIAL'
  | 'RESTRICTED';

export type DocumentVisibility =
  | 'PRIVATE'
  | 'TEAM'
  | 'ORGANIZATION'
  | 'PUBLIC';

export type SubjectType = 'USER' | 'ROLE' | 'ORGANIZATION' | 'TEAM';

export type DocumentPermissionType =
  | 'VIEW'
  | 'DOWNLOAD'
  | 'EDIT'
  | 'SHARE'
  | 'APPROVE'
  | 'DELETE';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type KnowledgeStatus = 'DRAFT' | 'UNDER_REVIEW' | 'PUBLISHED' | 'ARCHIVED';

export type LegalHoldStatus = 'ACTIVE' | 'RELEASED';

export interface CreateDocumentInput {
  title: string;
  description?: string;
  documentType?: DocumentType;
  classification?: DocumentClassification;
  visibility?: DocumentVisibility;
  folderId?: string;
  organizationId?: string;
  fileContent: Buffer | string;
  fileName: string;
  mimeType?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  effectiveDate?: Date;
  expirationDate?: Date;
  idempotencyKey?: string;
}

export interface UpdateDocumentInput {
  title?: string;
  description?: string;
  classification?: DocumentClassification;
  visibility?: DocumentVisibility;
  folderId?: string | null;
  tags?: string[];
  metadata?: Record<string, any>;
  effectiveDate?: Date | null;
  expirationDate?: Date | null;
}

export interface CreateVersionInput {
  documentId: string;
  fileContent: Buffer | string;
  fileName: string;
  mimeType?: string;
  changeSummary?: string;
}

export interface CreateFolderInput {
  name: string;
  description?: string;
  parentFolderId?: string;
  visibility?: DocumentVisibility;
}

export interface ShareDocumentInput {
  documentId: string;
  sharedWithId?: string;
  sharedWithType?: SubjectType;
  permission?: DocumentPermissionType;
  expiresInDays?: number;
}

export interface RequestApprovalInput {
  documentId: string;
  versionId: string;
  reviewerId?: string;
  comments?: string;
}

export interface CreateKnowledgeCollectionInput {
  name: string;
  description?: string;
  visibility?: DocumentVisibility;
}

export interface CreateKnowledgeEntryInput {
  collectionId: string;
  title: string;
  content: string;
  sourceDocumentId?: string;
}

export interface PlaceLegalHoldInput {
  documentId: string;
  reason: string;
}

export interface DocumentSearchFilters {
  query?: string;
  documentType?: DocumentType;
  status?: DocumentStatus;
  classification?: DocumentClassification;
  visibility?: DocumentVisibility;
  folderId?: string;
  ownerId?: string;
  isArchived?: boolean;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

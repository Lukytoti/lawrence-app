import { db } from '@/lib/db';
import { CreateDocumentInput, UpdateDocumentInput, DocumentSearchFilters } from './types';
import { getStorageProvider } from './storage/provider';
import { validateFileSafety, sanitizeFilename, sanitizeForAudit, generateCorrelationId } from './security';
import {
  canViewDocument,
  canEditDocument,
  canDeleteDocument,
  DOCUMENT_PERMISSIONS,
  hasDocumentPermission,
} from './permissions';
import { searchDocuments } from './search';
import { EventBus } from '@/lib/events';

export async function createDocument(input: CreateDocumentInput, actorUserId: string) {
  const canCreate = await hasDocumentPermission(actorUserId, DOCUMENT_PERMISSIONS.CREATE);
  const canUpload = await hasDocumentPermission(actorUserId, DOCUMENT_PERMISSIONS.UPLOAD);
  if (!canCreate && !canUpload) {
    throw new Error('Unauthorized: Missing documents:create or documents:upload permission');
  }

  const cleanName = sanitizeFilename(input.fileName);
  const buffer = Buffer.isBuffer(input.fileContent) ? input.fileContent : Buffer.from(input.fileContent, 'utf-8');
  validateFileSafety(cleanName, buffer.length, input.mimeType);

  const documentCode = `DOC_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
  const storage = getStorageProvider();
  const storagePath = `documents/${documentCode}/v1_${cleanName}`;
  const meta = await storage.upload(storagePath, buffer, input.mimeType);

  const versionCode = `VER_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

  const createdDoc = await db.$transaction(async (tx) => {
    const doc = await tx.document.create({
      data: {
        documentCode,
        title: input.title,
        description: input.description,
        documentType: input.documentType || 'GENERAL',
        status: 'ACTIVE',
        folderId: input.folderId,
        ownerId: actorUserId,
        organizationId: input.organizationId,
        classification: input.classification || 'INTERNAL',
        visibility: input.visibility || 'ORGANIZATION',
        mimeType: meta.mimeType || input.mimeType,
        fileSizeBytes: meta.fileSizeBytes,
        storageReference: meta.storageReference,
        checksum: meta.checksum,
        isArchived: false,
      },
    });

    const version = await tx.documentVersion.create({
      data: {
        versionCode,
        documentId: doc.id,
        versionNumber: 1,
        storageReference: meta.storageReference,
        checksum: meta.checksum,
        mimeType: meta.mimeType || input.mimeType,
        fileSizeBytes: meta.fileSizeBytes,
        changeSummary: 'Initial upload',
        createdById: actorUserId,
      },
    });

    await tx.documentMetadata.create({
      data: {
        documentId: doc.id,
        metadataJson: JSON.stringify(input.metadata || {}),
        tagsJson: input.tags ? JSON.stringify(input.tags) : null,
        effectiveDate: input.effectiveDate,
        expirationDate: input.expirationDate,
      },
    });

    if (input.tags && input.tags.length > 0) {
      for (const tagName of input.tags) {
        const tagCode = `TAG_${tagName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
        const tag = await tx.documentTag.upsert({
          where: { tagCode },
          update: {},
          create: { tagCode, name: tagName },
        });

        await tx.documentTagAssignment.create({
          data: {
            documentId: doc.id,
            tagId: tag.id,
          },
        });
      }
    }

    await tx.documentActivityLog.create({
      data: {
        activityCode: `ACT_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
        documentId: doc.id,
        versionId: version.id,
        activityType: 'DOCUMENT_CREATED',
        actorId: actorUserId,
        message: `Document created: ${doc.title}`,
        correlationId: generateCorrelationId(),
      },
    });

    const updatedDoc = await tx.document.update({
      where: { id: doc.id },
      data: { currentVersionId: version.id },
      include: {
        versions: true,
        metadata: true,
      },
    });

    return updatedDoc;
  });

  EventBus.publish({
    id: `evt_${Date.now()}`,
    type: 'DocumentCreated',
    actorId: actorUserId,
    payload: {
      documentId: createdDoc.id,
      documentCode: createdDoc.documentCode,
      title: createdDoc.title,
      documentType: createdDoc.documentType,
    },
    timestamp: new Date(),
  });

  return sanitizeForAudit(createdDoc);
}

export async function updateDocumentMetadata(
  documentId: string,
  input: UpdateDocumentInput,
  actorUserId: string
) {
  const canEdit = await canEditDocument(actorUserId, documentId);
  if (!canEdit) throw new Error('Unauthorized to update this document');

  const updated = await db.$transaction(async (tx) => {
    const doc = await tx.document.update({
      where: { id: documentId },
      data: {
        title: input.title,
        description: input.description,
        classification: input.classification,
        visibility: input.visibility,
        folderId: input.folderId !== undefined ? input.folderId : undefined,
      },
    });

    if (input.metadata !== undefined || input.effectiveDate !== undefined || input.expirationDate !== undefined) {
      await tx.documentMetadata.upsert({
        where: { documentId },
        update: {
          metadataJson: input.metadata ? JSON.stringify(input.metadata) : undefined,
          tagsJson: input.tags ? JSON.stringify(input.tags) : undefined,
          effectiveDate: input.effectiveDate,
          expirationDate: input.expirationDate,
        },
        create: {
          documentId,
          metadataJson: JSON.stringify(input.metadata || {}),
          tagsJson: input.tags ? JSON.stringify(input.tags) : null,
          effectiveDate: input.effectiveDate,
          expirationDate: input.expirationDate,
        },
      });
    }

    await tx.documentActivityLog.create({
      data: {
        activityCode: `ACT_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
        documentId,
        activityType: 'METADATA_UPDATED',
        actorId: actorUserId,
        message: `Updated document metadata for: ${doc.title}`,
        correlationId: generateCorrelationId(),
      },
    });

    return doc;
  });

  EventBus.publish({
    id: `evt_${Date.now()}`,
    type: 'DocumentUpdated',
    actorId: actorUserId,
    payload: {
      documentId,
      title: updated.title,
    },
    timestamp: new Date(),
  });

  return sanitizeForAudit(updated);
}

export async function archiveDocument(documentId: string, actorUserId: string) {
  const canDelete = await canDeleteDocument(actorUserId, documentId);
  if (!canDelete) throw new Error('Unauthorized to archive this document or active legal hold blocks action');

  const updated = await db.$transaction(async (tx) => {
    const doc = await tx.document.update({
      where: { id: documentId },
      data: { isArchived: true, status: 'ARCHIVED' },
    });

    await tx.documentActivityLog.create({
      data: {
        activityCode: `ACT_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
        documentId,
        activityType: 'DOCUMENT_ARCHIVED',
        actorId: actorUserId,
        message: `Document archived: ${doc.title}`,
        correlationId: generateCorrelationId(),
      },
    });

    return doc;
  });

  EventBus.publish({
    id: `evt_${Date.now()}`,
    type: 'DocumentArchived',
    actorId: actorUserId,
    payload: { documentId },
    timestamp: new Date(),
  });

  return sanitizeForAudit(updated);
}

export async function restoreDocument(documentId: string, actorUserId: string) {
  const canEdit = await canEditDocument(actorUserId, documentId);
  if (!canEdit) throw new Error('Unauthorized to restore this document');

  const updated = await db.$transaction(async (tx) => {
    const doc = await tx.document.update({
      where: { id: documentId },
      data: { isArchived: false, status: 'ACTIVE' },
    });

    await tx.documentActivityLog.create({
      data: {
        activityCode: `ACT_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
        documentId,
        activityType: 'DOCUMENT_RESTORED',
        actorId: actorUserId,
        message: `Document restored: ${doc.title}`,
        correlationId: generateCorrelationId(),
      },
    });

    return doc;
  });

  EventBus.publish({
    id: `evt_${Date.now()}`,
    type: 'DocumentRestored',
    actorId: actorUserId,
    payload: { documentId },
    timestamp: new Date(),
  });

  return sanitizeForAudit(updated);
}

export async function getDocument(documentId: string, actorUserId: string) {
  const canView = await canViewDocument(actorUserId, documentId);
  if (!canView) {
    EventBus.publish({
      id: `evt_${Date.now()}`,
      type: 'DocumentAccessDenied',
      actorId: actorUserId,
      payload: { documentId, reason: 'Insufficient document permission' },
      timestamp: new Date(),
    });
    throw new Error('Access denied: You do not have permission to view this document');
  }

  const doc = await db.document.findUnique({
    where: { id: documentId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      folder: { select: { id: true, name: true, folderCode: true } },
      versions: { orderBy: { versionNumber: 'desc' } },
      metadata: true,
      tags: { include: { tag: true } },
      permissions: {
        include: { grantedBy: { select: { id: true, name: true, email: true } } },
      },
      shares: {
        where: { revokedAt: null },
      },
      approvals: { orderBy: { requestedAt: 'desc' } },
      relations: true,
      legalHolds: { where: { status: 'ACTIVE' } },
    },
  });

  if (!doc) throw new Error('Document not found');

  return sanitizeForAudit(doc);
}

export async function listDocuments(filters: DocumentSearchFilters, actorUserId: string) {
  return await searchDocuments(filters, actorUserId);
}

export async function moveDocument(documentId: string, targetFolderId: string | null, actorUserId: string) {
  const canEdit = await canEditDocument(actorUserId, documentId);
  if (!canEdit) throw new Error('Unauthorized to move this document');

  if (targetFolderId) {
    const folder = await db.documentFolder.findUnique({ where: { id: targetFolderId } });
    if (!folder) throw new Error('Target folder not found');
  }

  const updated = await db.document.update({
    where: { id: documentId },
    data: { folderId: targetFolderId },
  });

  return sanitizeForAudit(updated);
}

export async function deleteDocument(documentId: string, actorUserId: string) {
  const canDelete = await canDeleteDocument(actorUserId, documentId);
  if (!canDelete) {
    throw new Error('Unauthorized to delete document or active legal hold prohibits deletion');
  }

  const doc = await db.document.findUnique({
    where: { id: documentId },
    include: { versions: true },
  });

  if (!doc) throw new Error('Document not found');

  // Delete physical storage references
  const storage = getStorageProvider();
  for (const ver of doc.versions) {
    await storage.delete(ver.storageReference);
  }

  await db.document.delete({ where: { id: documentId } });

  EventBus.publish({
    id: `evt_${Date.now()}`,
    type: 'DocumentDeleted',
    actorId: actorUserId,
    payload: { documentId, documentCode: doc.documentCode },
    timestamp: new Date(),
  });

  return { success: true, deletedDocumentId: documentId };
}

export async function getDocumentHistory(documentId: string, actorUserId: string) {
  const canView = await canViewDocument(actorUserId, documentId);
  if (!canView) throw new Error('Unauthorized to view document history');

  const history = await db.documentActivityLog.findMany({
    where: { documentId },
    orderBy: { createdAt: 'desc' },
    include: {
      actor: { select: { id: true, name: true, email: true } },
    },
    take: 100,
  });

  return sanitizeForAudit(history);
}

export async function addDocumentRelation(
  documentId: string,
  relatedEntityType: string,
  relatedEntityId: string,
  relationType: string = 'ATTACHMENT',
  actorUserId: string
) {
  const canEdit = await canEditDocument(actorUserId, documentId);
  if (!canEdit) throw new Error('Unauthorized to associate this document');

  const relationCode = `REL_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

  const relation = await db.documentRelation.create({
    data: {
      relationCode,
      documentId,
      relatedEntityType,
      relatedEntityId,
      relationType,
      createdById: actorUserId,
    },
  });

  return sanitizeForAudit(relation);
}

export async function getDocumentsByRelation(
  relatedEntityType: string,
  relatedEntityId: string,
  actorUserId: string
) {
  const relations = await db.documentRelation.findMany({
    where: { relatedEntityType, relatedEntityId },
    include: {
      document: {
        include: {
          owner: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  return sanitizeForAudit(relations);
}

export async function getDocumentsDashboardOverview(actorUserId: string) {
  const [
    totalDocs,
    recentDocs,
    pendingApprovals,
    activeLegalHolds,
    activeKnowledgeEntries,
  ] = await Promise.all([
    db.document.count({ where: { isArchived: false } }),
    db.document.findMany({
      where: { isArchived: false },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        folder: { select: { id: true, name: true } },
      },
    }),
    db.documentApproval.count({ where: { status: 'PENDING' } }),
    db.recordLegalHold.count({ where: { status: 'ACTIVE' } }),
    db.knowledgeEntry.count({ where: { status: 'PUBLISHED' } }),
  ]);

  return sanitizeForAudit({
    metrics: {
      totalDocuments: totalDocs,
      pendingApprovals,
      activeLegalHolds,
      publishedKnowledgeArticles: activeKnowledgeEntries,
    },
    recentDocuments: recentDocs,
  });
}

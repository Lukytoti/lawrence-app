import { db } from '@/lib/db';
import { CreateVersionInput } from './types';
import { getStorageProvider } from './storage/provider';
import { validateFileSafety, sanitizeFilename, sanitizeForAudit, generateCorrelationId } from './security';
import { canEditDocument, canViewDocument } from './permissions';
import { EventBus } from '@/lib/events';

export async function createDocumentVersion(
  input: CreateVersionInput,
  actorUserId: string
) {
  const canEdit = await canEditDocument(actorUserId, input.documentId);
  if (!canEdit) {
    throw new Error('Unauthorized: You do not have permission to create a new version for this document');
  }

  const doc = await db.document.findUnique({
    where: { id: input.documentId },
    include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
  });

  if (!doc) throw new Error('Document not found');
  if (doc.isArchived) throw new Error('Cannot add versions to an archived document');

  const cleanName = sanitizeFilename(input.fileName);
  const buffer = Buffer.isBuffer(input.fileContent) ? input.fileContent : Buffer.from(input.fileContent, 'utf-8');
  validateFileSafety(cleanName, buffer.length, input.mimeType);

  const storage = getStorageProvider();
  const nextVersionNumber = (doc.versions[0]?.versionNumber || 0) + 1;
  const storagePath = `documents/${doc.id}/v${nextVersionNumber}_${cleanName}`;
  const meta = await storage.upload(storagePath, buffer, input.mimeType);

  const versionCode = `VER_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

  // Atomic database transaction to prevent concurrent duplicate versionNumber
  const newVersion = await db.$transaction(async (tx) => {
    const version = await tx.documentVersion.create({
      data: {
        versionCode,
        documentId: doc.id,
        versionNumber: nextVersionNumber,
        storageReference: meta.storageReference,
        checksum: meta.checksum,
        mimeType: meta.mimeType || input.mimeType,
        fileSizeBytes: meta.fileSizeBytes,
        changeSummary: input.changeSummary,
        createdById: actorUserId,
      },
    });

    await tx.document.update({
      where: { id: doc.id },
      data: {
        currentVersionId: version.id,
        mimeType: version.mimeType,
        fileSizeBytes: version.fileSizeBytes,
        storageReference: version.storageReference,
        checksum: version.checksum,
      },
    });

    await tx.documentActivityLog.create({
      data: {
        activityCode: `ACT_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
        documentId: doc.id,
        versionId: version.id,
        activityType: 'VERSION_CREATED',
        actorId: actorUserId,
        message: `Created document version ${version.versionNumber}: ${cleanName}`,
        correlationId: generateCorrelationId(),
      },
    });

    return version;
  });

  EventBus.publish({
    id: `evt_${Date.now()}`,
    type: 'DocumentVersionCreated',
    actorId: actorUserId,
    payload: {
      documentId: doc.id,
      versionId: newVersion.id,
      versionNumber: newVersion.versionNumber,
      versionCode: newVersion.versionCode,
    },
    timestamp: new Date(),
  });

  return sanitizeForAudit(newVersion);
}

export async function getDocumentVersion(versionId: string, actorUserId: string) {
  const version = await db.documentVersion.findUnique({
    where: { id: versionId },
    include: {
      document: true,
      createdBy: { select: { id: true, name: true, email: true } },
      approvals: true,
    },
  });

  if (!version) throw new Error('Version not found');

  const canView = await canViewDocument(actorUserId, version.documentId);
  if (!canView) throw new Error('Unauthorized to view this document version');

  return sanitizeForAudit(version);
}

export async function listDocumentVersions(documentId: string, actorUserId: string) {
  const canView = await canViewDocument(actorUserId, documentId);
  if (!canView) throw new Error('Unauthorized to view document versions');

  const versions = await db.documentVersion.findMany({
    where: { documentId },
    orderBy: { versionNumber: 'desc' },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      approvals: true,
    },
  });

  return sanitizeForAudit(versions);
}

export async function compareVersions(version1Id: string, version2Id: string, actorUserId: string) {
  const [v1, v2] = await Promise.all([
    db.documentVersion.findUnique({ where: { id: version1Id } }),
    db.documentVersion.findUnique({ where: { id: version2Id } }),
  ]);

  if (!v1 || !v2) throw new Error('One or both versions not found');
  if (v1.documentId !== v2.documentId) throw new Error('Cannot compare versions across different documents');

  const canView = await canViewDocument(actorUserId, v1.documentId);
  if (!canView) throw new Error('Unauthorized to compare document versions');

  return sanitizeForAudit({
    documentId: v1.documentId,
    version1: {
      id: v1.id,
      versionNumber: v1.versionNumber,
      checksum: v1.checksum,
      fileSizeBytes: v1.fileSizeBytes,
      createdAt: v1.createdAt,
      changeSummary: v1.changeSummary,
    },
    version2: {
      id: v2.id,
      versionNumber: v2.versionNumber,
      checksum: v2.checksum,
      fileSizeBytes: v2.fileSizeBytes,
      createdAt: v2.createdAt,
      changeSummary: v2.changeSummary,
    },
    isIdenticalChecksum: v1.checksum === v2.checksum,
    sizeDifferenceBytes: (v2.fileSizeBytes || 0) - (v1.fileSizeBytes || 0),
  });
}

export async function restoreVersion(documentId: string, sourceVersionId: string, actorUserId: string) {
  const canEdit = await canEditDocument(actorUserId, documentId);
  if (!canEdit) throw new Error('Unauthorized to edit this document');

  const sourceVersion = await db.documentVersion.findUnique({
    where: { id: sourceVersionId },
  });

  if (!sourceVersion || sourceVersion.documentId !== documentId) {
    throw new Error('Invalid source version for restore');
  }

  const storage = getStorageProvider();
  const fileContent = await storage.download(sourceVersion.storageReference);

  // Creating a new sequential version with old version's content
  return await createDocumentVersion({
    documentId,
    fileContent,
    fileName: `restored_v${sourceVersion.versionNumber}`,
    mimeType: sourceVersion.mimeType || undefined,
    changeSummary: `Restored content from version ${sourceVersion.versionNumber}`,
  }, actorUserId);
}

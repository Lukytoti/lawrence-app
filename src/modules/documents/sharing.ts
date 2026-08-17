import { db } from '@/lib/db';
import { ShareDocumentInput } from './types';
import { canShareDocument, canViewDocument } from './permissions';
import { generateCorrelationId, sanitizeForAudit } from './security';
import { EventBus } from '@/lib/events';

export async function shareDocument(input: ShareDocumentInput, actorUserId: string) {
  const canShare = await canShareDocument(actorUserId, input.documentId);
  if (!canShare) throw new Error('Unauthorized to share this document');

  const doc = await db.document.findUnique({ where: { id: input.documentId } });
  if (!doc) throw new Error('Document not found');
  if (doc.isArchived) throw new Error('Cannot share an archived document');

  const shareCode = `SHR_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
  let expiresAt: Date | null = null;
  if (input.expiresInDays && input.expiresInDays > 0) {
    expiresAt = new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000);
  }

  const share = await db.documentShare.create({
    data: {
      shareCode,
      documentId: input.documentId,
      sharedWithId: input.sharedWithId,
      sharedWithType: input.sharedWithType || 'USER',
      permission: input.permission || 'VIEW',
      expiresAt,
      createdById: actorUserId,
    },
  });

  await db.documentActivityLog.create({
    data: {
      activityCode: `ACT_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
      documentId: input.documentId,
      activityType: 'DOCUMENT_SHARED',
      actorId: actorUserId,
      message: `Document shared with ${input.sharedWithType || 'USER'}: ${input.sharedWithId || 'Link'}`,
      correlationId: generateCorrelationId(),
    },
  });

  EventBus.publish({
    id: `evt_${Date.now()}`,
    type: 'DocumentShared',
    actorId: actorUserId,
    payload: {
      documentId: input.documentId,
      shareId: share.id,
      shareCode: share.shareCode,
      sharedWithId: share.sharedWithId,
    },
    timestamp: new Date(),
  });

  return sanitizeForAudit(share);
}

export async function revokeShare(shareId: string, actorUserId: string) {
  const share = await db.documentShare.findUnique({
    where: { id: shareId },
    include: { document: true },
  });

  if (!share) throw new Error('Share link not found');

  const canShare = await canShareDocument(actorUserId, share.documentId);
  if (!canShare) throw new Error('Unauthorized to revoke this share');

  const updated = await db.documentShare.update({
    where: { id: shareId },
    data: { revokedAt: new Date() },
  });

  await db.documentActivityLog.create({
    data: {
      activityCode: `ACT_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
      documentId: share.documentId,
      activityType: 'SHARE_REVOKED',
      actorId: actorUserId,
      message: `Share code ${share.shareCode} revoked`,
      correlationId: generateCorrelationId(),
    },
  });

  EventBus.publish({
    id: `evt_${Date.now()}`,
    type: 'DocumentShareRevoked',
    actorId: actorUserId,
    payload: {
      documentId: share.documentId,
      shareId: share.id,
    },
    timestamp: new Date(),
  });

  return sanitizeForAudit(updated);
}

export async function getActiveShares(documentId: string, actorUserId: string) {
  const canView = await canViewDocument(actorUserId, documentId);
  if (!canView) throw new Error('Unauthorized to view shares for this document');

  const now = new Date();
  const shares = await db.documentShare.findMany({
    where: {
      documentId,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  return sanitizeForAudit(shares);
}

export async function validateShare(shareCode: string) {
  const share = await db.documentShare.findUnique({
    where: { shareCode },
    include: {
      document: {
        include: {
          versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
        },
      },
    },
  });

  if (!share) {
    return { isValid: false, error: 'Share link not found' };
  }

  if (share.revokedAt) {
    return { isValid: false, error: 'Share link has been revoked' };
  }

  if (share.expiresAt && share.expiresAt < new Date()) {
    return { isValid: false, error: 'Share link has expired' };
  }

  if (share.document.isArchived) {
    return { isValid: false, error: 'Referenced document is archived' };
  }

  return sanitizeForAudit({
    isValid: true,
    document: share.document,
    permission: share.permission,
  });
}

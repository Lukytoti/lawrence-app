import { db } from '@/lib/db';
import { PlaceLegalHoldInput } from './types';
import { DOCUMENT_PERMISSIONS, hasDocumentPermission } from './permissions';
import { generateCorrelationId, sanitizeForAudit } from './security';
import { EventBus } from '@/lib/events';

export async function createRetentionPolicy(
  data: {
    name: string;
    description?: string;
    documentType: string;
    retentionDays: number;
    legalHoldSupported?: boolean;
    autoArchive?: boolean;
    autoDelete?: boolean;
  },
  actorUserId: string
) {
  const hasManage = await hasDocumentPermission(actorUserId, DOCUMENT_PERMISSIONS.MANAGE_RETENTION);
  if (!hasManage) {
    throw new Error('Unauthorized: Missing documents:manage_retention permission');
  }

  const policyCode = `POL_RET_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

  const policy = await db.recordRetentionPolicy.create({
    data: {
      policyCode,
      name: data.name,
      description: data.description,
      documentType: data.documentType,
      retentionDays: data.retentionDays,
      legalHoldSupported: data.legalHoldSupported !== undefined ? data.legalHoldSupported : true,
      autoArchive: data.autoArchive || false,
      autoDelete: data.autoDelete || false,
      isActive: true,
    },
  });

  return sanitizeForAudit(policy);
}

export async function listRetentionPolicies() {
  const policies = await db.recordRetentionPolicy.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return sanitizeForAudit(policies);
}

export async function placeLegalHold(input: PlaceLegalHoldInput, actorUserId: string) {
  const hasManage = await hasDocumentPermission(actorUserId, DOCUMENT_PERMISSIONS.MANAGE_LEGAL_HOLD);
  if (!hasManage) {
    throw new Error('Unauthorized: Missing documents:manage_legal_hold permission');
  }

  const doc = await db.document.findUnique({ where: { id: input.documentId } });
  if (!doc) throw new Error('Document not found');

  const holdCode = `HLD_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

  const hold = await db.$transaction(async (tx) => {
    const h = await tx.recordLegalHold.create({
      data: {
        holdCode,
        documentId: input.documentId,
        reason: input.reason,
        placedById: actorUserId,
        status: 'ACTIVE',
      },
    });

    await tx.documentActivityLog.create({
      data: {
        activityCode: `ACT_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
        documentId: input.documentId,
        activityType: 'LEGAL_HOLD_PLACED',
        actorId: actorUserId,
        message: `Legal hold placed: ${input.reason}`,
        correlationId: generateCorrelationId(),
      },
    });

    return h;
  });

  EventBus.publish({
    id: `evt_${Date.now()}`,
    type: 'LegalHoldPlaced',
    actorId: actorUserId,
    payload: {
      documentId: input.documentId,
      holdId: hold.id,
      holdCode: hold.holdCode,
      reason: input.reason,
    },
    timestamp: new Date(),
  });

  return sanitizeForAudit(hold);
}

export async function releaseLegalHold(holdId: string, actorUserId: string) {
  const hasManage = await hasDocumentPermission(actorUserId, DOCUMENT_PERMISSIONS.MANAGE_LEGAL_HOLD);
  if (!hasManage) {
    throw new Error('Unauthorized: Missing documents:manage_legal_hold permission');
  }

  const hold = await db.recordLegalHold.findUnique({ where: { id: holdId } });
  if (!hold) throw new Error('Legal hold not found');
  if (hold.status === 'RELEASED') {
    throw new Error('Legal hold has already been released');
  }

  const updated = await db.$transaction(async (tx) => {
    const h = await tx.recordLegalHold.update({
      where: { id: holdId },
      data: {
        status: 'RELEASED',
        releasedById: actorUserId,
        releasedAt: new Date(),
      },
    });

    await tx.documentActivityLog.create({
      data: {
        activityCode: `ACT_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
        documentId: hold.documentId,
        activityType: 'LEGAL_HOLD_RELEASED',
        actorId: actorUserId,
        message: `Legal hold released: ${hold.holdCode}`,
        correlationId: generateCorrelationId(),
      },
    });

    return h;
  });

  EventBus.publish({
    id: `evt_${Date.now()}`,
    type: 'LegalHoldReleased',
    actorId: actorUserId,
    payload: {
      documentId: hold.documentId,
      holdId: updated.id,
      holdCode: updated.holdCode,
    },
    timestamp: new Date(),
  });

  return sanitizeForAudit(updated);
}

export async function listLegalHolds(documentId?: string) {
  const where: any = {};
  if (documentId) where.documentId = documentId;

  const holds = await db.recordLegalHold.findMany({
    where,
    orderBy: { placedAt: 'desc' },
    include: {
      document: { select: { id: true, title: true, documentCode: true } },
      placedBy: { select: { id: true, name: true, email: true } },
      releasedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return sanitizeForAudit(holds);
}

export async function getRetentionDueDocuments() {
  const policies = await db.recordRetentionPolicy.findMany({ where: { isActive: true } });
  const dueList: Array<{ document: any; policy: any; ageDays: number }> = [];

  const now = Date.now();

  for (const policy of policies) {
    const cutoffDate = new Date(now - policy.retentionDays * 24 * 60 * 60 * 1000);
    const docs = await db.document.findMany({
      where: {
        documentType: policy.documentType,
        createdAt: { lte: cutoffDate },
        status: { notIn: ['ARCHIVED', 'DELETED'] },
        legalHolds: { none: { status: 'ACTIVE' } }, // Legal hold exempts from retention deletion
      },
      include: {
        legalHolds: { where: { status: 'ACTIVE' } },
      },
    });

    for (const doc of docs) {
      const ageDays = Math.floor((now - new Date(doc.createdAt).getTime()) / (24 * 60 * 60 * 1000));
      dueList.push({ document: doc, policy, ageDays });
    }
  }

  return sanitizeForAudit(dueList);
}

export async function evaluateRetention() {
  const dueItems = await getRetentionDueDocuments();
  return {
    totalEvaluated: dueItems.length,
    dueDocuments: dueItems,
  };
}

export async function executeAutomatedRetention(actorUserId: string = 'system') {
  const dueItems = await getRetentionDueDocuments();
  const results = {
    archivedCount: 0,
    deletedCount: 0,
    skippedDueToLegalHold: 0,
  };

  for (const item of dueItems) {
    const { document: doc, policy } = item;

    // Check legal hold safety
    const activeHolds = await db.recordLegalHold.count({
      where: { documentId: doc.id, status: 'ACTIVE' },
    });

    if (activeHolds > 0) {
      results.skippedDueToLegalHold++;
      continue;
    }

    if (policy.autoDelete) {
      await db.document.update({
        where: { id: doc.id },
        data: { status: 'DELETED', isArchived: true },
      });
      results.deletedCount++;
    } else if (policy.autoArchive) {
      await db.document.update({
        where: { id: doc.id },
        data: { status: 'ARCHIVED', isArchived: true },
      });
      results.archivedCount++;
    }
  }

  EventBus.publish({
    id: `evt_${Date.now()}`,
    type: 'DocumentRetentionExecuted',
    actorId: actorUserId,
    payload: results,
    timestamp: new Date(),
  });

  return results;
}

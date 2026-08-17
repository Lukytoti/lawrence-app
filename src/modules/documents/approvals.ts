import { db } from '@/lib/db';
import { RequestApprovalInput } from './types';
import { canApproveDocument, canViewDocument } from './permissions';
import { generateCorrelationId, sanitizeForAudit } from './security';
import { EventBus } from '@/lib/events';

export async function requestApproval(input: RequestApprovalInput, actorUserId: string) {
  const version = await db.documentVersion.findUnique({
    where: { id: input.versionId },
    include: { document: true },
  });

  if (!version || version.documentId !== input.documentId) {
    throw new Error('Invalid document version specified for approval');
  }

  // Prevent multiple pending approvals for same version
  const existingPending = await db.documentApproval.findFirst({
    where: {
      versionId: input.versionId,
      status: 'PENDING',
    },
  });

  if (existingPending) {
    throw new Error('An approval request is already pending for this document version');
  }

  const approvalCode = `APP_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

  const approval = await db.$transaction(async (tx) => {
    const app = await tx.documentApproval.create({
      data: {
        approvalCode,
        documentId: input.documentId,
        versionId: input.versionId,
        requestedById: actorUserId,
        reviewerId: input.reviewerId,
        comments: input.comments,
        status: 'PENDING',
      },
    });

    await tx.document.update({
      where: { id: input.documentId },
      data: { status: 'UNDER_REVIEW' },
    });

    await tx.documentActivityLog.create({
      data: {
        activityCode: `ACT_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
        documentId: input.documentId,
        versionId: input.versionId,
        activityType: 'APPROVAL_REQUESTED',
        actorId: actorUserId,
        message: `Approval requested for version ${version.versionNumber}`,
        correlationId: generateCorrelationId(),
      },
    });

    return app;
  });

  return sanitizeForAudit(approval);
}

export async function approveDocument(approvalId: string, comments?: string, reviewerUserId?: string) {
  const approval = await db.documentApproval.findUnique({
    where: { id: approvalId },
    include: { document: true, version: true },
  });

  if (!approval) throw new Error('Approval request not found');
  if (approval.status !== 'PENDING') {
    throw new Error(`Cannot approve: Request is already ${approval.status}`);
  }

  const reviewerId = reviewerUserId || approval.reviewerId;
  if (!reviewerId) {
    throw new Error('Reviewer ID required to complete approval');
  }

  // Separation of duties check: Requester cannot approve their own document request
  if (approval.requestedById === reviewerId) {
    throw new Error('Separation of duties violation: You cannot approve your own document request');
  }

  const canApprove = await canApproveDocument(reviewerId, approval.documentId);
  if (!canApprove) {
    throw new Error('Unauthorized: You do not have permission to approve this document');
  }

  const updated = await db.$transaction(async (tx) => {
    const app = await tx.documentApproval.update({
      where: { id: approvalId },
      data: {
        status: 'APPROVED',
        reviewerId,
        reviewedAt: new Date(),
        comments: comments || approval.comments,
      },
    });

    await tx.document.update({
      where: { id: approval.documentId },
      data: { status: 'APPROVED' },
    });

    await tx.documentActivityLog.create({
      data: {
        activityCode: `ACT_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
        documentId: approval.documentId,
        versionId: approval.versionId,
        activityType: 'DOCUMENT_APPROVED',
        actorId: reviewerId,
        message: `Document version ${approval.version.versionNumber} approved`,
        correlationId: generateCorrelationId(),
      },
    });

    return app;
  });

  EventBus.publish({
    id: `evt_${Date.now()}`,
    type: 'DocumentApproved',
    actorId: reviewerId,
    payload: {
      documentId: approval.documentId,
      versionId: approval.versionId,
      approvalId: approval.id,
    },
    timestamp: new Date(),
  });

  return sanitizeForAudit(updated);
}

export async function rejectDocument(approvalId: string, comments: string, reviewerUserId: string) {
  const approval = await db.documentApproval.findUnique({
    where: { id: approvalId },
    include: { document: true, version: true },
  });

  if (!approval) throw new Error('Approval request not found');
  if (approval.status !== 'PENDING') {
    throw new Error(`Cannot reject: Request is already ${approval.status}`);
  }

  const canApprove = await canApproveDocument(reviewerUserId, approval.documentId);
  if (!canApprove) {
    throw new Error('Unauthorized: You do not have permission to review this document');
  }

  const updated = await db.$transaction(async (tx) => {
    const app = await tx.documentApproval.update({
      where: { id: approvalId },
      data: {
        status: 'REJECTED',
        reviewerId: reviewerUserId,
        reviewedAt: new Date(),
        comments,
      },
    });

    await tx.document.update({
      where: { id: approval.documentId },
      data: { status: 'REJECTED' },
    });

    await tx.documentActivityLog.create({
      data: {
        activityCode: `ACT_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
        documentId: approval.documentId,
        versionId: approval.versionId,
        activityType: 'DOCUMENT_REJECTED',
        actorId: reviewerUserId,
        message: `Document version ${approval.version.versionNumber} rejected: ${comments}`,
        correlationId: generateCorrelationId(),
      },
    });

    return app;
  });

  EventBus.publish({
    id: `evt_${Date.now()}`,
    type: 'DocumentRejected',
    actorId: reviewerUserId,
    payload: {
      documentId: approval.documentId,
      versionId: approval.versionId,
      approvalId: approval.id,
      reason: comments,
    },
    timestamp: new Date(),
  });

  return sanitizeForAudit(updated);
}

export async function cancelApproval(approvalId: string, actorUserId: string) {
  const approval = await db.documentApproval.findUnique({ where: { id: approvalId } });
  if (!approval) throw new Error('Approval request not found');
  if (approval.status !== 'PENDING') {
    throw new Error(`Cannot cancel: Request is already ${approval.status}`);
  }
  if (approval.requestedById !== actorUserId) {
    throw new Error('Unauthorized: Only the requester can cancel this approval request');
  }

  const updated = await db.documentApproval.update({
    where: { id: approvalId },
    data: { status: 'CANCELLED' },
  });

  return sanitizeForAudit(updated);
}

export async function getApprovalHistory(documentId: string, actorUserId: string) {
  const canView = await canViewDocument(actorUserId, documentId);
  if (!canView) throw new Error('Unauthorized to view approval history');

  const history = await db.documentApproval.findMany({
    where: { documentId },
    orderBy: { requestedAt: 'desc' },
    include: {
      version: { select: { id: true, versionNumber: true, versionCode: true } },
      requestedBy: { select: { id: true, name: true, email: true } },
      reviewer: { select: { id: true, name: true, email: true } },
    },
  });

  return sanitizeForAudit(history);
}

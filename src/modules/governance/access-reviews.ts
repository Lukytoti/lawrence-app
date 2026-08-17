import { db } from '@/lib/db';
import { CreateAccessReviewInput, AccessReviewStatus } from './types';
import { recordSecurityEvent } from './security-events';
import { eventBus } from '@/lib/events';
import crypto from 'crypto';

export async function createAccessReview(input: CreateAccessReviewInput) {
  const count = await db.accessReview.count();
  const reviewCode = `ACCREV-2026-${(100001 + count).toString().padStart(6, '0')}-${crypto.randomBytes(2).toString('hex')}`;

  // Fetch target user permissions from existing RBAC authority
  const userRoles = await db.userRole.findMany({
    where: { userId: input.userId },
    include: { role: { include: { permissions: { include: { permission: true } } } } },
  });

  const permissionsList: { permission: string; source: string }[] = [];
  for (const ur of userRoles) {
    for (const rp of ur.role.permissions) {
      permissionsList.push({
        permission: rp.permission.code,
        source: `Role:${ur.role.name}`,
      });
    }
  }

  const review = await db.accessReview.create({
    data: {
      reviewCode,
      userId: input.userId,
      reviewerId: input.reviewerId,
      status: 'PENDING',
      notes: input.notes,
      metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
      items: {
        create: permissionsList.map((p) => ({
          permission: p.permission,
          source: p.source,
          currentState: 'ACTIVE',
          recommendedAction: 'RETAIN',
        })),
      },
    },
    include: { items: true },
  });

  await recordSecurityEvent({
    eventType: 'ANOMALY_DETECTED',
    severity: 'INFO',
    source: 'ACCESS_GOVERNANCE',
    actorId: input.reviewerId,
    resourceType: 'AccessReview',
    resourceId: review.id,
    action: 'CREATE_ACCESS_REVIEW',
    result: 'SUCCESS',
    metadata: { reviewCode, targetUserId: input.userId },
  });

  eventBus.publish('AccessReviewCreated', {
    reviewId: review.id,
    reviewCode: review.reviewCode,
    userId: review.userId,
    reviewerId: review.reviewerId,
  });

  return review;
}

export async function reviewAccessItem(
  itemId: string,
  reviewedAction: 'RETAIN' | 'REVOKE' | 'MODIFY',
  reviewerNotes?: string
) {
  return db.accessReviewItem.update({
    where: { id: itemId },
    data: {
      reviewedAction,
      reviewerNotes,
    },
  });
}

export async function completeAccessReview(
  reviewId: string,
  decision: 'APPROVED' | 'REVOKED',
  actorUserId: string
) {
  const review = await db.accessReview.findUnique({
    where: { id: reviewId },
    include: { items: true },
  });
  if (!review) throw new Error(`Access review not found: ${reviewId}`);

  const updated = await db.accessReview.update({
    where: { id: reviewId },
    data: {
      status: decision,
      completedAt: new Date(),
    },
  });

  await recordSecurityEvent({
    eventType: 'PRIVILEGE_ESCALATION',
    severity: decision === 'REVOKED' ? 'HIGH' : 'LOW',
    source: 'ACCESS_GOVERNANCE',
    actorId: actorUserId,
    resourceType: 'AccessReview',
    resourceId: reviewId,
    action: `COMPLETE_REVIEW_${decision}`,
    result: 'SUCCESS',
    metadata: { decision, userId: review.userId },
  });

  if (decision === 'REVOKED') {
    eventBus.publish('AccessRevoked', {
      reviewId,
      userId: review.userId,
      revokedById: actorUserId,
    });
  }

  return updated;
}

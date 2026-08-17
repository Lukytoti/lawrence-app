import { db } from '@/lib/db';
import { RequestClientReviewInput, SubmitClientReviewInput } from './types';
import { logAuditEvent } from '@/lib/audit';
import { updateDeliverableStatus } from './deliverables';

export async function requestClientReview(input: RequestClientReviewInput) {
  const deliverable = await db.projectDeliverable.findUnique({
    where: { id: input.deliverableId },
  });

  if (!deliverable) throw new Error(`Deliverable ${input.deliverableId} not found.`);

  // Create ClientReview record
  const review = await db.clientReview.create({
    data: {
      projectId: input.projectId,
      deliverableId: input.deliverableId,
      requestedAt: new Date(),
      status: 'PENDING',
    },
  });

  // Update deliverable status to UNDER_REVIEW
  await updateDeliverableStatus(input.deliverableId, 'UNDER_REVIEW', input.actorUserId);

  // Update project status to CLIENT_REVIEW if ACTIVE
  const project = await db.digitalProject.findUnique({ where: { id: input.projectId } });
  if (project && (project.status === 'ACTIVE' || project.status === 'PLANNED')) {
    await db.digitalProject.update({
      where: { id: input.projectId },
      data: { status: 'CLIENT_REVIEW' },
    });
  }

  await db.projectActivity.create({
    data: {
      projectId: input.projectId,
      actorId: input.actorUserId,
      activityType: 'REVIEW_REQUESTED',
      visibility: 'CLIENT_VISIBLE',
      description: `Client review requested for deliverable ${deliverable.name} (v${deliverable.version})`,
    },
  });

  await logAuditEvent({
    actorId: input.actorUserId,
    action: 'CLIENT_REVIEW_REQUESTED',
    entityType: 'ClientReview',
    entityId: review.id,
    metadata: { projectId: input.projectId, deliverableId: input.deliverableId },
  });

  return review;
}

export async function submitClientReview(input: SubmitClientReviewInput) {
  return db.$transaction(async (tx) => {
    // 1. Lock ProjectDeliverable row FOR UPDATE
    await tx.$queryRaw`SELECT id FROM "ProjectDeliverable" WHERE id = ${input.deliverableId} FOR UPDATE;`;

    const review = await tx.clientReview.findFirst({
      where: { projectId: input.projectId, deliverableId: input.deliverableId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    const deliverable = await tx.projectDeliverable.findUnique({
      where: { id: input.deliverableId },
    });

    if (!deliverable) throw new Error(`Deliverable ${input.deliverableId} not found.`);

    const reviewStatus = input.status;
    const newDeliverableStatus = reviewStatus === 'APPROVED' ? 'APPROVED' : 'REVISION_REQUIRED';

    let updatedReview = null;
    if (review) {
      updatedReview = await tx.clientReview.update({
        where: { id: review.id },
        data: {
          status: reviewStatus,
          reviewedAt: new Date(),
          feedback: input.feedback,
          reviewedById: input.reviewedByUserId,
        },
      });
    } else {
      updatedReview = await tx.clientReview.create({
        data: {
          projectId: input.projectId,
          deliverableId: input.deliverableId,
          status: reviewStatus,
          requestedAt: new Date(),
          reviewedAt: new Date(),
          feedback: input.feedback,
          reviewedById: input.reviewedByUserId,
        },
      });
    }

    // Update Deliverable Status
    const approvedAt = newDeliverableStatus === 'APPROVED' ? new Date() : undefined;
    const rejectedAt = newDeliverableStatus === 'REVISION_REQUIRED' ? new Date() : undefined;

    await tx.projectDeliverable.update({
      where: { id: input.deliverableId },
      data: {
        status: newDeliverableStatus,
        approvedAt: approvedAt || deliverable.approvedAt,
        rejectedAt: rejectedAt || deliverable.rejectedAt,
      },
    });

    // Update Project Status if revision required
    if (reviewStatus === 'REVISION_REQUESTED') {
      await tx.digitalProject.update({
        where: { id: input.projectId },
        data: { status: 'REVISION_REQUIRED' },
      });
    }

    await tx.projectActivity.create({
      data: {
        projectId: input.projectId,
        actorId: input.reviewedByUserId,
        activityType: 'REVIEW_SUBMITTED',
        visibility: 'CLIENT_VISIBLE',
        description: `Client review submitted for ${deliverable.name}: ${reviewStatus}`,
        metadataJson: JSON.stringify({ feedback: input.feedback }),
      },
    });

    await logAuditEvent({
      actorId: input.reviewedByUserId,
      action: 'CLIENT_REVIEW_SUBMITTED',
      entityType: 'ClientReview',
      entityId: updatedReview.id,
      metadata: { status: reviewStatus, deliverableId: input.deliverableId },
    });

    return updatedReview;
  });
}

import { db } from '@/lib/db';
import { SubmitDeliverableInput, DeliverableStatus } from './types';
import { logAuditEvent } from '@/lib/audit';

export async function submitDeliverable(input: SubmitDeliverableInput) {
  // Check if a deliverable with same name exists in project (for versioning)
  const existingDeliverables = await db.projectDeliverable.findMany({
    where: { projectId: input.projectId, name: input.name },
    orderBy: { version: 'desc' },
  });

  const latestVersion = existingDeliverables.length > 0 ? existingDeliverables[0].version : 0;
  const nextVersion = latestVersion + 1;

  const deliverable = await db.projectDeliverable.create({
    data: {
      projectId: input.projectId,
      milestoneId: input.milestoneId,
      name: input.name,
      description: input.description,
      type: input.type || 'FILE',
      status: 'SUBMITTED',
      version: nextVersion,
      submittedAt: new Date(),
      evidenceId: input.evidenceId,
    },
    include: { evidence: true, milestone: true },
  });

  await db.projectActivity.create({
    data: {
      projectId: input.projectId,
      actorId: input.actorUserId,
      activityType: 'DELIVERABLE_SUBMITTED',
      visibility: 'CLIENT_VISIBLE',
      description: `Deliverable submitted: ${deliverable.name} (v${deliverable.version})`,
      metadataJson: JSON.stringify({ version: deliverable.version, evidenceId: input.evidenceId }),
    },
  });

  await logAuditEvent({
    actorId: input.actorUserId,
    action: 'DELIVERABLE_SUBMITTED',
    entityType: 'ProjectDeliverable',
    entityId: deliverable.id,
    metadata: { projectId: input.projectId, name: deliverable.name, version: deliverable.version },
  });

  return deliverable;
}

export async function updateDeliverableStatus(
  deliverableId: string,
  newStatus: DeliverableStatus,
  actorUserId: string
) {
  const del = await db.projectDeliverable.findUnique({ where: { id: deliverableId } });
  if (!del) throw new Error(`Deliverable ${deliverableId} not found.`);

  const approvedAt = newStatus === 'APPROVED' ? new Date() : undefined;
  const rejectedAt = newStatus === 'REJECTED' || newStatus === 'REVISION_REQUIRED' ? new Date() : undefined;

  const updatedDeliverable = await db.projectDeliverable.update({
    where: { id: deliverableId },
    data: {
      status: newStatus,
      approvedAt: approvedAt || del.approvedAt,
      rejectedAt: rejectedAt || del.rejectedAt,
    },
  });

  await db.projectActivity.create({
    data: {
      projectId: del.projectId,
      actorId: actorUserId,
      activityType: newStatus === 'APPROVED' ? 'DELIVERABLE_APPROVED' : 'DELIVERABLE_REJECTED',
      visibility: 'CLIENT_VISIBLE',
      description: `Deliverable ${del.name} (v${del.version}) status updated to ${newStatus}`,
    },
  });

  await logAuditEvent({
    actorId: actorUserId,
    action: 'DELIVERABLE_UPDATED',
    entityType: 'ProjectDeliverable',
    entityId: deliverableId,
    metadata: { status: newStatus, version: del.version },
  });

  return updatedDeliverable;
}

export async function getProjectDeliverables(projectId: string) {
  return db.projectDeliverable.findMany({
    where: { projectId },
    include: { evidence: true, milestone: true, reviews: true },
    orderBy: [{ name: 'asc' }, { version: 'desc' }],
  });
}

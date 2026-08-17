import { db } from '@/lib/db';
import { CreateMilestoneInput, MilestoneStatus } from './types';
import { logAuditEvent } from '@/lib/audit';

export async function createMilestone(input: CreateMilestoneInput, actorUserId: string) {
  const existingCount = await db.digitalMilestone.count({
    where: { projectId: input.projectId },
  });

  const milestone = await db.digitalMilestone.create({
    data: {
      projectId: input.projectId,
      name: input.name,
      description: input.description,
      sequence: input.sequence || existingCount + 1,
      status: 'PENDING',
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
    },
  });

  await db.projectActivity.create({
    data: {
      projectId: input.projectId,
      actorId: actorUserId,
      activityType: 'MILESTONE_CREATED',
      visibility: 'CLIENT_VISIBLE',
      description: `Milestone created: ${milestone.name}`,
    },
  });

  await logAuditEvent({
    actorId: actorUserId,
    action: 'MILESTONE_CREATED',
    entityType: 'DigitalMilestone',
    entityId: milestone.id,
    metadata: { projectId: input.projectId, name: milestone.name },
  });

  return milestone;
}

export async function updateMilestoneStatus(
  milestoneId: string,
  newStatus: MilestoneStatus,
  actorUserId: string
) {
  const milestone = await db.digitalMilestone.findUnique({ where: { id: milestoneId } });
  if (!milestone) throw new Error(`Milestone ${milestoneId} not found.`);

  const completedAt = newStatus === 'COMPLETED' ? new Date() : undefined;

  const updatedMilestone = await db.digitalMilestone.update({
    where: { id: milestoneId },
    data: {
      status: newStatus,
      completedAt: completedAt || milestone.completedAt,
    },
  });

  await db.projectActivity.create({
    data: {
      projectId: milestone.projectId,
      actorId: actorUserId,
      activityType: 'MILESTONE_COMPLETED',
      visibility: 'CLIENT_VISIBLE',
      description: `Milestone status updated to ${newStatus}: ${milestone.name}`,
    },
  });

  await logAuditEvent({
    actorId: actorUserId,
    action: 'MILESTONE_UPDATED',
    entityType: 'DigitalMilestone',
    entityId: milestoneId,
    metadata: { status: newStatus },
  });

  return updatedMilestone;
}

export async function getProjectMilestones(projectId: string) {
  return db.digitalMilestone.findMany({
    where: { projectId },
    include: { tasks: true, deliverables: true },
    orderBy: { sequence: 'asc' },
  });
}

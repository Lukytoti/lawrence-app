import { db } from '@/lib/db';
import { CreateSuccessPlanInput, SuccessPlanStatus } from './types';
import { logAuditEvent } from '@/lib/audit';

export async function createSuccessPlan(
  input: CreateSuccessPlanInput,
  actorUserId: string
) {
  const plan = await db.clientSuccessPlan.create({
    data: {
      clientId: input.clientId,
      title: input.title,
      clientObjectives: input.clientObjectives,
      successMilestones: JSON.stringify(input.successMilestones),
      expectedOutcomes: input.expectedOutcomes,
      reviewDate: input.reviewDate,
      ownerId: input.ownerId,
      status: 'DRAFT',
    },
    include: { client: true, owner: true },
  });

  await logAuditEvent({
    actorId: actorUserId,
    action: 'SUCCESS_PLAN_CREATED',
    entityType: 'ClientSuccessPlan',
    entityId: plan.id,
    metadata: { clientId: input.clientId, title: plan.title },
  });

  return plan;
}

export async function updateSuccessPlanStatus(
  planId: string,
  newStatus: SuccessPlanStatus,
  actorUserId: string
) {
  const plan = await db.clientSuccessPlan.update({
    where: { id: planId },
    data: { status: newStatus },
  });

  await logAuditEvent({
    actorId: actorUserId,
    action: 'SUCCESS_PLAN_UPDATED',
    entityType: 'ClientSuccessPlan',
    entityId: planId,
    metadata: { status: newStatus },
  });

  return plan;
}

export async function getSuccessPlans(clientId?: string) {
  return db.clientSuccessPlan.findMany({
    where: clientId ? { clientId } : undefined,
    include: { client: true, owner: true },
    orderBy: { createdAt: 'desc' },
  });
}

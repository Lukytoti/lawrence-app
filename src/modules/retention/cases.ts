import { db } from '@/lib/db';
import { CreateRetentionCaseInput, RetentionCaseStatus } from './types';
import { logAuditEvent } from '@/lib/audit';
import { eventBus } from '@/lib/events';

const ALLOWED_CASE_TRANSITIONS: Record<string, string[]> = {
  OPEN: ['INVESTIGATING', 'ACTION_PLAN', 'MONITORING', 'RESOLVED', 'CHURNED'],
  INVESTIGATING: ['ACTION_PLAN', 'MONITORING', 'RESOLVED', 'CHURNED'],
  ACTION_PLAN: ['MONITORING', 'RESOLVED', 'CHURNED'],
  MONITORING: ['RESOLVED', 'CHURNED'],
  RESOLVED: [],
  CHURNED: [],
};

export async function createRetentionCase(
  input: CreateRetentionCaseInput,
  actorUserId: string
) {
  const retentionCase = await db.clientRetentionCase.create({
    data: {
      clientId: input.clientId,
      severity: input.severity || 'MEDIUM',
      reason: input.reason,
      detectedSignals: input.detectedSignals ? JSON.stringify(input.detectedSignals) : null,
      assignedOwnerId: input.assignedOwnerId,
      actionPlan: input.actionPlan,
      dueDate: input.dueDate,
      status: 'OPEN',
    },
    include: { client: true, assignedOwner: true },
  });

  // If assignedOwnerId exists and actionPlan exists, integrate with Prompt 04 Task
  if (input.assignedOwnerId && input.actionPlan) {
    const member = await db.networkMember.findFirst({
      where: { userId: input.assignedOwnerId },
    });
    if (member) {
      await db.task.create({
        data: {
          assigneeId: member.id,
          assignedBy: input.assignedOwnerId || actorUserId,
          title: `[Retention Action Plan] ${retentionCase.client.companyName || retentionCase.client.contactName}`,
          description: input.actionPlan,
          priority: input.severity === 'CRITICAL' ? 'URGENT' : 'HIGH',
          status: 'TODO',
          dueDate: input.dueDate || new Date(Date.now() + 86400000 * 3),
        },
      });
    }
  }

  await logAuditEvent({
    actorId: actorUserId,
    action: 'RETENTION_CASE_CREATED',
    entityType: 'ClientRetentionCase',
    entityId: retentionCase.id,
    metadata: { clientId: input.clientId, severity: retentionCase.severity, reason: input.reason },
  });

  await eventBus.publish(
    'RetentionCaseCreated',
    { caseId: retentionCase.id, clientId: input.clientId, severity: retentionCase.severity },
    actorUserId
  );

  return retentionCase;
}

export async function updateRetentionCaseStatus(
  caseId: string,
  newStatus: RetentionCaseStatus,
  resolution: string | undefined,
  actorUserId: string
) {
  const currentCase = await db.clientRetentionCase.findUnique({ where: { id: caseId } });
  if (!currentCase) throw new Error(`ClientRetentionCase ${caseId} not found.`);

  if (currentCase.status === 'RESOLVED' || currentCase.status === 'CHURNED') {
    throw new Error(`Invalid retention case status transition from ${currentCase.status} to ${newStatus}. Terminal state cannot be changed.`);
  }

  if (currentCase.status === newStatus) return currentCase;

  const allowed = ALLOWED_CASE_TRANSITIONS[currentCase.status] || [];
  if (!allowed.includes(newStatus)) {
    throw new Error(`Invalid retention case status transition from ${currentCase.status} to ${newStatus}.`);
  }

  const isTerminal = newStatus === 'RESOLVED' || newStatus === 'CHURNED';
  const updated = await db.clientRetentionCase.update({
    where: { id: caseId },
    data: {
      status: newStatus,
      resolution: resolution || currentCase.resolution,
      resolvedAt: isTerminal ? new Date() : currentCase.resolvedAt,
    },
    include: { client: true },
  });

  await logAuditEvent({
    actorId: actorUserId,
    action: isTerminal ? 'RETENTION_CASE_RESOLVED' : 'RETENTION_CASE_UPDATED',
    entityType: 'ClientRetentionCase',
    entityId: caseId,
    metadata: { fromStatus: currentCase.status, toStatus: newStatus, resolution },
  });

  await eventBus.publish(
    'RetentionCaseResolved',
    { caseId, clientId: currentCase.clientId, status: newStatus },
    actorUserId
  );

  return updated;
}

export async function getRetentionCases(clientId?: string) {
  return db.clientRetentionCase.findMany({
    where: clientId ? { clientId } : undefined,
    include: { client: true, assignedOwner: true },
    orderBy: { createdAt: 'desc' },
  });
}

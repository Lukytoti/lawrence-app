import { db } from '@/lib/db';
import { CreateWorkflowInput, CreateStepInput, WorkflowStatus } from './types';
import { logAuditEvent } from '@/lib/audit';

const ALLOWED_WORKFLOW_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['ACTIVE', 'ARCHIVED'],
  ACTIVE: ['PAUSED', 'ARCHIVED'],
  PAUSED: ['ACTIVE', 'ARCHIVED'],
  ARCHIVED: [],
};

export async function createWorkflow(input: CreateWorkflowInput, actorUserId: string) {
  const workflow = await db.automationWorkflow.create({
    data: {
      workflowCode: input.workflowCode,
      name: input.name,
      description: input.description,
      domain: input.domain || 'CROSS_DOMAIN',
      triggerType: input.triggerType || 'EVENT',
      createdById: input.createdById,
      status: 'DRAFT',
      isActive: false, // Default DRAFT state
      version: 1,
    },
    include: { triggers: true, steps: true, createdBy: true },
  });

  await logAuditEvent({
    actorId: actorUserId,
    action: 'AUTOMATION_CREATED',
    entityType: 'AutomationWorkflow',
    entityId: workflow.id,
    metadata: { workflowCode: workflow.workflowCode, name: workflow.name },
  });

  return workflow;
}

export async function updateWorkflowStatus(
  workflowId: string,
  newStatus: WorkflowStatus,
  actorUserId: string
) {
  const workflow = await db.automationWorkflow.findUnique({ where: { id: workflowId } });
  if (!workflow) throw new Error(`AutomationWorkflow ${workflowId} not found.`);

  const currentStatus = workflow.status || (workflow.isActive ? 'ACTIVE' : 'DRAFT');
  if (currentStatus === newStatus) return workflow;

  const allowed = ALLOWED_WORKFLOW_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    throw new Error(`Invalid workflow status transition from ${currentStatus} to ${newStatus}.`);
  }

  const updated = await db.automationWorkflow.update({
    where: { id: workflowId },
    data: {
      status: newStatus,
      isActive: newStatus === 'ACTIVE',
    },
  });

  await logAuditEvent({
    actorId: actorUserId,
    action: newStatus === 'ACTIVE' ? 'AUTOMATION_ACTIVATED' : 'AUTOMATION_PAUSED',
    entityType: 'AutomationWorkflow',
    entityId: workflowId,
    metadata: { from: currentStatus, to: newStatus },
  });

  return updated;
}

export async function addWorkflowStep(input: CreateStepInput, actorUserId: string) {
  const configJson =
    typeof input.configurationJson === 'string'
      ? input.configurationJson
      : JSON.stringify(input.configurationJson);

  const step = await db.automationStep.create({
    data: {
      workflowId: input.workflowId,
      sequence: input.sequence,
      type: input.type,
      configurationJson: configJson,
      isActive: true,
    },
  });

  return step;
}

export async function getWorkflows(domain?: string) {
  return db.automationWorkflow.findMany({
    where: domain ? { domain } : undefined,
    include: { triggers: true, steps: { orderBy: { sequence: 'asc' } }, createdBy: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getWorkflowById(id: string) {
  return db.automationWorkflow.findUnique({
    where: { id },
    include: {
      triggers: true,
      steps: { orderBy: { sequence: 'asc' } },
      executions: { orderBy: { createdAt: 'desc' }, take: 10 },
      schedules: true,
      createdBy: true,
    },
  });
}

'use server';

import { assertAutomationPermission } from './permissions';
import { createWorkflow, updateWorkflowStatus, addWorkflowStep } from './workflows';
import { executeWorkflow } from './executor';
import { CreateWorkflowInput, CreateStepInput, ExecuteWorkflowInput, WorkflowStatus } from './types';

export async function createWorkflowAction(actorUserId: string, input: CreateWorkflowInput) {
  await assertAutomationPermission(actorUserId, 'automation:create');
  return createWorkflow(input, actorUserId);
}

export async function updateWorkflowStatusAction(
  actorUserId: string,
  workflowId: string,
  newStatus: WorkflowStatus
) {
  const perm = newStatus === 'ACTIVE' ? 'automation:activate' : 'automation:pause';
  await assertAutomationPermission(actorUserId, perm);
  return updateWorkflowStatus(workflowId, newStatus, actorUserId);
}

export async function addWorkflowStepAction(actorUserId: string, input: CreateStepInput) {
  await assertAutomationPermission(actorUserId, 'automation:update');
  return addWorkflowStep(input, actorUserId);
}

export async function executeWorkflowAction(actorUserId: string, input: ExecuteWorkflowInput) {
  await assertAutomationPermission(actorUserId, 'automation:execute');
  return executeWorkflow({ ...input, actorUserId });
}

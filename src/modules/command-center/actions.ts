'use server';

import { searchAll } from './search';
import { getExecutiveKpiSummary } from './service';
import { getPersonalWorkQueue } from './work-queue';
import { getUniversalActivityTimeline } from './activity';
import { checkSystemHealth } from './health';
import { getExecutiveAlerts } from './alerts';
import { processAiCommand } from './ai-command';
import { SearchQueryInput } from './types';
import { createLead } from '@/modules/crm/service';
import { createInvoice } from '@/modules/billing/invoices';
import { createRetentionCase } from '@/modules/retention/cases';
import { executeWorkflow } from '@/modules/automation/executor';
import { dispatchNotification } from '@/modules/notifications/dispatcher';
import { db } from '@/lib/db';

export async function searchAllAction(input: SearchQueryInput, actorUserId: string) {
  return searchAll(input, actorUserId);
}

export async function getExecutiveKpiSummaryAction(actorUserId: string) {
  return getExecutiveKpiSummary(actorUserId);
}

export async function getPersonalWorkQueueAction(actorUserId: string) {
  return getPersonalWorkQueue(actorUserId);
}

export async function getUniversalActivityTimelineAction(actorUserId: string, limit?: number) {
  return getUniversalActivityTimeline(actorUserId, limit);
}

export async function checkSystemHealthAction() {
  return checkSystemHealth();
}

export async function getExecutiveAlertsAction(actorUserId: string) {
  return getExecutiveAlerts(actorUserId);
}

export async function processAiCommandAction(
  prompt: string,
  actorUserId: string,
  conversationId?: string
) {
  return processAiCommand(prompt, actorUserId, conversationId);
}

export async function executeQuickAction(
  actionType: string,
  payload: Record<string, any>,
  actorUserId: string
) {
  switch (actionType) {
    case 'CREATE_TASK': {
      const member = await db.networkMember.findFirst({ where: { userId: actorUserId } });
      const targetMemberId = member?.id || payload.assigneeId || actorUserId;
      return db.task.create({
        data: {
          title: payload.title,
          description: payload.description,
          priority: payload.priority || 'MEDIUM',
          assigneeId: targetMemberId,
          assignedBy: actorUserId,
          status: 'PENDING',
        },
      });
    }
    case 'CREATE_LEAD':
      return createLead({
        ...payload,
        ownerId: actorUserId,
      } as any);
    case 'CREATE_INVOICE':
      return createInvoice(payload as any, actorUserId);
    case 'CREATE_RETENTION_CASE':
      return createRetentionCase(payload as any, actorUserId);
    case 'EXECUTE_WORKFLOW':
      return executeWorkflow({
        workflowId: payload.workflowId,
        triggerType: payload.triggerType || 'MANUAL',
        actorUserId,
        idempotencyKey: payload.idempotencyKey || `CC-AUTO-${Date.now()}-${crypto.randomUUID()}`,
        contextPayload: payload,
      });
    case 'DISPATCH_NOTIFICATION':
      return dispatchNotification(payload as any, actorUserId);
    default:
      throw new Error(`Unsupported quick action type: ${actionType}`);
  }
}

import crypto from 'crypto';
import { db } from '@/lib/db';
import { executeWorkflow } from './executor';

/**
 * Validates incoming webhook HMAC signature for security.
 */
export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const hmacBuf = Buffer.from(hmac);
  const sigBuf = Buffer.from(signature);
  if (hmacBuf.length !== sigBuf.length) return false;
  return crypto.timingSafeEqual(hmacBuf, sigBuf);
}

/**
 * Process incoming event trigger across active workflows.
 */
export async function triggerWorkflowsForEvent(
  eventName: string,
  eventPayload: Record<string, any>,
  actorUserId = 'SYSTEM'
) {
  const matchingTriggers = await db.automationTrigger.findMany({
    where: {
      type: 'EVENT',
      workflow: { isActive: true },
    },
    include: { workflow: true },
  });

  const executed = [];

  for (const trigger of matchingTriggers) {
    let config: any = {};
    try {
      config = typeof trigger.configurationJson === 'string' ? JSON.parse(trigger.configurationJson) : trigger.configurationJson;
    } catch (err) {
      config = {};
    }

    if (config.eventName && config.eventName !== eventName) continue;

    const idKey = `Event:${eventName}:${eventPayload.id || eventPayload.leadId || eventPayload.invoiceId || Date.now()}`;
    const result = await executeWorkflow({
      workflowId: trigger.workflowId,
      triggerType: 'EVENT',
      triggerEvent: eventName,
      idempotencyKey: idKey,
      contextPayload: eventPayload,
      actorUserId,
    });
    executed.push(result);
  }

  return executed;
}

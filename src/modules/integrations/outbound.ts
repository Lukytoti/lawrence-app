import crypto from 'crypto';
import { db } from '@/lib/db';
import { generateHmacSignature } from './security';
import { eventBus } from '@/lib/events';

export interface DispatchOutboundWebhookInput {
  integrationId: string;
  endpointUrl: string;
  eventType: string;
  payload: any;
  secret: string;
}

export async function dispatchOutboundWebhook(input: DispatchOutboundWebhookInput) {
  const payloadStr = JSON.stringify(input.payload);
  const signature = generateHmacSignature(payloadStr, input.secret, 'HMAC_SHA256');
  const payloadHash = crypto.createHash('sha256').update(payloadStr).digest('hex');
  const idempotencyKey = `out_idem_${payloadHash}_${Date.now()}`;
  const eventCode = `OUTEVT-2026-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const event = await db.integrationEvent.create({
    data: {
      eventCode,
      integrationId: input.integrationId,
      direction: 'OUTBOUND',
      eventType: input.eventType,
      idempotencyKey,
      payloadHash,
      status: 'PROCESSED',
      processedAt: new Date(),
      metadataJson: JSON.stringify({
        endpointUrl: input.endpointUrl,
        signature,
        payload: input.payload,
      }),
    },
  });

  eventBus.publish('OutboundWebhookDispatched', {
    eventId: event.id,
    integrationId: input.integrationId,
    eventType: input.eventType,
  });

  return event;
}

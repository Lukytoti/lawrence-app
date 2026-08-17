import crypto from 'crypto';
import { db } from '@/lib/db';
import { verifyWebhookSignature } from './security';
import { retrieveCredential } from './credentials';
import { routeInboundEvent } from './router';
import { eventBus } from '@/lib/events';

export interface ProcessInboundWebhookInput {
  webhookCode: string;
  rawBody: string;
  headers: Record<string, string>;
  externalEventId?: string;
  idempotencyKey?: string;
}

export async function processInboundWebhook(input: ProcessInboundWebhookInput) {
  const webhook = await db.integrationWebhook.findUnique({
    where: { webhookCode: input.webhookCode },
    include: { integration: true },
  });

  if (!webhook || !webhook.isActive) {
    throw new Error(`Active webhook configuration not found for code ${input.webhookCode}`);
  }

  // 1. Verify Webhook Signature
  const isProduction = process.env.NODE_ENV === 'production';
  const creds = retrieveCredential(webhook.secretReference);
  const secret = creds?.secret || (isProduction ? '' : 'default-secret');

  if (isProduction && !secret) {
    await db.integrationLog.create({
      data: {
        integrationId: webhook.integrationId,
        level: 'ERROR',
        eventType: 'WEBHOOK_SIGNATURE_FAILED',
        message: `Webhook secret not configured in production for ${input.webhookCode}`,
      },
    });

    eventBus.publish('WebhookSignatureFailed', {
      webhookCode: input.webhookCode,
      integrationId: webhook.integrationId,
    });

    throw new Error(`Production webhook secret not configured for ${input.webhookCode}`);
  }

  const sigHeader = input.headers['x-webhook-signature'] || input.headers['x-hub-signature-256'] || input.headers['signature'];

  const isValidSig = verifyWebhookSignature(input.rawBody, sigHeader, secret, webhook.signatureAlgorithm);
  if (!isValidSig) {
    await db.integrationLog.create({
      data: {
        integrationId: webhook.integrationId,
        level: 'WARN',
        eventType: 'WEBHOOK_SIGNATURE_FAILED',
        message: `Webhook signature verification failed for ${input.webhookCode}`,
      },
    });

    eventBus.publish('WebhookSignatureFailed', {
      webhookCode: input.webhookCode,
      integrationId: webhook.integrationId,
    });

    throw new Error('Invalid webhook signature');
  }

  // 2. Generate / Enforce Idempotency Key & Payload Hash
  const payloadHash = crypto.createHash('sha256').update(input.rawBody).digest('hex');
  const idempotencyKey = input.idempotencyKey || input.externalEventId || `wh_idem_${payloadHash}`;

  // Check for existing event to enforce strict database-level idempotency
  const existingEvent = await db.integrationEvent.findUnique({
    where: { idempotencyKey },
  });

  if (existingEvent) {
    // Already processed or receiving duplicate delivery
    return { isDuplicate: true, event: existingEvent };
  }

  // 3. Store IntegrationEvent
  const eventCode = `INTEVT-2026-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const event = await db.integrationEvent.create({
    data: {
      eventCode,
      integrationId: webhook.integrationId,
      direction: 'INBOUND',
      eventType: webhook.eventType,
      externalEventId: input.externalEventId,
      idempotencyKey,
      payloadHash,
      status: 'PROCESSING',
      metadataJson: input.rawBody,
    },
  });

  // Update webhook lastReceivedAt timestamp
  await db.integrationWebhook.update({
    where: { id: webhook.id },
    data: { lastReceivedAt: new Date() },
  });

  // 4. Route Inbound Event to Authoritative Domain Service
  try {
    let parsedPayload: any;
    try {
      parsedPayload = JSON.parse(input.rawBody);
    } catch {
      parsedPayload = { raw: input.rawBody };
    }

    const routeResult = await routeInboundEvent(webhook.eventType, parsedPayload, event.id);

    const updatedEvent = await db.integrationEvent.update({
      where: { id: event.id },
      data: {
        status: 'PROCESSED',
        processedAt: new Date(),
      },
    });

    return { isDuplicate: false, event: updatedEvent, routeResult };
  } catch (err: any) {
    const failedEvent = await db.integrationEvent.update({
      where: { id: event.id },
      data: {
        status: 'FAILED',
        error: err.message || 'Domain routing failed',
      },
    });

    return { isDuplicate: false, event: failedEvent, error: err.message };
  }
}

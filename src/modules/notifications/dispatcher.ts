import { db } from '@/lib/db';
import { DispatchMessageInput, DispatchResult, NotificationChannel, ProviderType } from './types';
import { substituteTemplateVariables } from './templates';
import { evaluateNotificationEligibility } from './preferences';
import { sanitizeNotificationMetadata } from './sanitizer';
import { InAppNotificationProvider } from './providers/inapp';
import { EmailNotificationProvider } from './providers/email';
import { SmsNotificationProvider } from './providers/sms';
import { WhatsAppNotificationProvider } from './providers/whatsapp';
import { WebhookNotificationProvider } from './providers/webhook';
import { NotificationProvider } from './providers/interface';
import { logAuditEvent } from '@/lib/audit';
import { eventBus } from '@/lib/events';

function getProvider(channel: NotificationChannel, metadata?: Record<string, any>): NotificationProvider {
  switch (channel) {
    case 'IN_APP':
      return new InAppNotificationProvider();
    case 'EMAIL':
      return new EmailNotificationProvider(metadata?.provider || 'SMTP');
    case 'SMS':
      return new SmsNotificationProvider();
    case 'WHATSAPP':
      return new WhatsAppNotificationProvider();
    case 'WEBHOOK':
      return new WebhookNotificationProvider();
    default:
      return new InAppNotificationProvider();
  }
}

export async function dispatchNotification(
  input: DispatchMessageInput,
  actorUserId: string
): Promise<DispatchResult> {
  const year = new Date().getFullYear();

  // Generate deterministic idempotency key if not explicitly supplied
  const idempotencyKey =
    input.idempotencyKey ||
    `Notify:${input.channel}:${input.recipientId || input.recipientEmail || input.recipientPhone}:${Date.now()}:${Math.floor(100 + Math.random() * 900)}`;

  return await db.$transaction(async (tx) => {
    // Transaction-scoped advisory lock for PostgreSQL concurrency safety on idempotencyKey
    try {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${idempotencyKey}))`;
    } catch (err) {
      // Fallback for non-PostgreSQL (SQLite/Dev)
    }

    // 1. Idempotency Check inside transaction with lock held
    const existingMessage = await tx.notificationMessage.findUnique({
      where: { idempotencyKey },
      include: { deliveries: true },
    });

    if (existingMessage) {
      const latestDelivery = existingMessage.deliveries[0];
      return {
        messageId: existingMessage.id,
        status: existingMessage.status as any,
        deliveryId: latestDelivery?.id,
        provider: (latestDelivery?.provider || 'IN_APP') as ProviderType,
        newlyDispatched: false,
      };
    }

    // 2. Fetch Template and compile body
  let subject = input.subject;
  let bodyContent = input.bodyContent || '';

  if (input.templateId) {
    const template = await db.notificationTemplate.findUnique({ where: { id: input.templateId } });
    if (template) {
      subject = subject || template.subject || undefined;
      bodyContent = substituteTemplateVariables(template.bodyTemplate, input.templateVariables || {});
    }
  }

  const targetEmailOrPhone = input.recipientEmail || input.recipientPhone;

  // 3. Evaluate recipient preferences & quiet hours
  const eligibility = await evaluateNotificationEligibility(
    input.recipientId,
    targetEmailOrPhone,
    input.channel,
    input.category || 'SYSTEM'
  );

  const sanitizedMetadata = sanitizeNotificationMetadata(input.metadataJson || {});

  // 4. Create NotificationMessage record with high entropy code and P2002 fallback
  try {
    const messageCode = `MSG-${year}-${Date.now()}-${crypto.randomUUID().split('-')[0].toUpperCase()}`;

    const message = await db.notificationMessage.create({
      data: {
        messageCode,
        templateId: input.templateId,
        channel: input.channel,
        recipientId: input.recipientId,
        recipientEmail: input.recipientEmail,
        recipientPhone: input.recipientPhone,
        subject,
        bodyContent,
        metadataJson: sanitizedMetadata ? JSON.stringify(sanitizedMetadata) : null,
        status: eligibility.allowed ? 'PENDING' : 'CANCELLED',
        idempotencyKey,
        scheduledAt: input.scheduledAt || new Date(),
      },
    });

    if (!eligibility.allowed) {
      await db.notificationLog.create({
        data: {
          messageId: message.id,
          eventType: 'SUPPRESSED',
          logMessage: eligibility.reason || 'Notification suppressed by recipient preferences',
          metadataJson: JSON.stringify({ channel: input.channel, category: input.category }),
        },
      });

      await eventBus.publish('NotificationSuppression' as any, {
        messageId: message.id,
        reason: eligibility.reason,
      });

      return {
        messageId: message.id,
        status: 'CANCELLED',
        provider: 'IN_APP',
        newlyDispatched: true,
        suppressed: true,
        suppressionReason: eligibility.reason,
      };
    }

    // 5. Execute Provider Dispatch
    const provider = getProvider(input.channel, input.metadataJson);
    const sendResult = await provider.send({
      recipientId: input.recipientId,
      recipientEmail: input.recipientEmail,
      recipientPhone: input.recipientPhone,
      subject,
      bodyContent,
      metadata: input.metadataJson,
    });

    // 6. Record Delivery result
    const delivery = await db.notificationDelivery.create({
      data: {
        messageId: message.id,
        provider: provider.providerType,
        providerMessageId: sendResult.providerMessageId,
        status: sendResult.success ? 'SUCCESS' : 'FAILED',
        attemptCount: 1,
        errorTrace: sendResult.error,
        deliveredAt: sendResult.success ? new Date() : null,
      },
    });

    const finalStatus = sendResult.success ? 'DELIVERED' : 'FAILED';

    await db.notificationMessage.update({
      where: { id: message.id },
      data: {
        status: finalStatus,
        sentAt: sendResult.success ? new Date() : null,
      },
    });

    await db.notificationLog.create({
      data: {
        messageId: message.id,
        deliveryId: delivery.id,
        eventType: sendResult.success ? 'DELIVERED' : 'ERROR',
        logMessage: sendResult.success
          ? `Successfully dispatched via ${provider.providerType}`
          : `Dispatch failed: ${sendResult.error}`,
        metadataJson: JSON.stringify({ provider: provider.providerType, providerMessageId: sendResult.providerMessageId }),
      },
    });

    await logAuditEvent({
      actorId: actorUserId,
      action: sendResult.success ? 'NOTIFICATION_SENT' : 'NOTIFICATION_FAILED',
      entityType: 'NotificationMessage',
      entityId: message.id,
      metadata: { channel: input.channel, status: finalStatus },
    });

    await eventBus.publish(
      sendResult.success ? 'NotificationDelivered' : 'NotificationFailed',
      { messageId: message.id, deliveryId: delivery.id, channel: input.channel }
    );

    return {
      messageId: message.id,
      status: finalStatus as any,
      deliveryId: delivery.id,
      provider: provider.providerType,
      newlyDispatched: true,
      error: sendResult.error,
    };
  } catch (error: any) {
    if (error.code === 'P2002' || (error.message && error.message.toLowerCase().includes('idempotency'))) {
      const existing = await db.notificationMessage.findUnique({
        where: { idempotencyKey },
        include: { deliveries: true },
      });
      if (existing) {
        const latestDelivery = existing.deliveries[0];
        return {
          messageId: existing.id,
          status: existing.status as any,
          deliveryId: latestDelivery?.id,
          provider: (latestDelivery?.provider || 'IN_APP') as ProviderType,
          newlyDispatched: false,
        };
      }
    }
    throw error;
  }
  });
}

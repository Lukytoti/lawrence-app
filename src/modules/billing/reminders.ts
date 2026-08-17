import { db } from '@/lib/db';
import { ReminderType } from './types';
import { logAuditEvent } from '@/lib/audit';

export async function scheduleInvoiceReminder(
  invoiceId: string,
  type: ReminderType,
  scheduledFor: Date,
  actorUserId = 'SYSTEM'
) {
  const existing = await db.billingReminder.findFirst({
    where: { invoiceId, type, status: { in: ['SCHEDULED', 'SENT'] } },
  });

  if (existing) {
    return existing;
  }

  const reminder = await db.billingReminder.create({
    data: {
      invoiceId,
      type,
      scheduledFor,
      status: 'SCHEDULED',
      channel: 'EMAIL',
    },
  });

  return reminder;
}

export async function processInvoiceReminders(asOfDate = new Date(), actorUserId = 'SYSTEM') {
  const dueReminders = await db.billingReminder.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledFor: { lte: asOfDate },
    },
    include: { invoice: { include: { client: true } } },
  });

  const processed = [];

  for (const rem of dueReminders) {
    // Process sending reminder
    const updated = await db.billingReminder.update({
      where: { id: rem.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    await logAuditEvent({
      actorId: actorUserId,
      action: 'BILLING_REMINDER_SENT',
      entityType: 'BillingReminder',
      entityId: rem.id,
      metadata: { invoiceNumber: rem.invoice.invoiceNumber, type: rem.type },
    });

    processed.push(updated);
  }

  return processed;
}

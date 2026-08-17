import { db } from '@/lib/db';
import { CreateBillingScheduleInput } from './types';
import { createInvoice } from './invoices';
import { logAuditEvent } from '@/lib/audit';

export async function createBillingSchedule(input: CreateBillingScheduleInput, actorUserId: string) {
  const schedule = await db.billingSchedule.create({
    data: {
      contractId: input.contractId,
      projectId: input.projectId,
      frequency: input.frequency,
      amount: input.amount,
      currency: input.currency || 'NGN',
      startDate: new Date(input.startDate),
      nextDueDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      status: 'ACTIVE',
    },
    include: { contract: true, project: true },
  });

  await logAuditEvent({
    actorId: actorUserId,
    action: 'BILLING_SCHEDULE_CREATED',
    entityType: 'BillingSchedule',
    entityId: schedule.id,
    metadata: { frequency: schedule.frequency, amount: Number(schedule.amount) },
  });

  return schedule;
}

export async function processDueBillingSchedules(asOfDate = new Date(), actorUserId = 'SYSTEM') {
  const dueSchedules = await db.billingSchedule.findMany({
    where: {
      status: 'ACTIVE',
      nextDueDate: { lte: asOfDate },
    },
    include: {
      contract: { include: { client: true } },
      project: { include: { client: true } },
    },
  });

  const generatedInvoices = [];

  for (const sched of dueSchedules) {
    if (sched.contract && (sched.contract.status === 'TERMINATED' || sched.contract.status === 'CANCELLED')) {
      continue;
    }

    const clientId = sched.contract?.clientId || sched.project?.clientId;
    if (!clientId) continue;

    // Deterministic period reference to prevent duplicate invoice generation
    const periodRef = `${sched.id}-${sched.nextDueDate.toISOString().slice(0, 10)}`;

    const existingInvoice = await db.invoice.findFirst({
      where: {
        billingScheduleId: sched.id,
        paymentReference: periodRef,
      },
    });

    if (existingInvoice) {
      generatedInvoices.push(existingInvoice);
      continue;
    }

    const description = `${sched.frequency} Billing for ${
      sched.contract?.title || sched.project?.title || 'Digital Services'
    } (${sched.nextDueDate.toLocaleDateString()})`;

    const inv = await createInvoice(
      {
        clientId,
        contractId: sched.contractId || undefined,
        projectId: sched.projectId || undefined,
        billingScheduleId: sched.id,
        currency: sched.currency,
        dueDate: sched.nextDueDate,
        notes: `Auto-generated from Billing Schedule ${sched.id}`,
        lineItems: [
          {
            description,
            quantity: 1,
            unitPrice: Number(sched.amount),
            projectId: sched.projectId || undefined,
          },
        ],
      },
      actorUserId,
      periodRef
    );

    generatedInvoices.push(inv);

    // Calculate next due date
    const current = new Date(sched.nextDueDate);
    let nextDate = new Date(current);

    if (sched.frequency === 'WEEKLY') {
      nextDate.setDate(current.getDate() + 7);
    } else if (sched.frequency === 'MONTHLY') {
      nextDate.setMonth(current.getMonth() + 1);
    } else if (sched.frequency === 'QUARTERLY') {
      nextDate.setMonth(current.getMonth() + 3);
    } else if (sched.frequency === 'ONE_TIME') {
      // Mark COMPLETED
      await db.billingSchedule.update({
        where: { id: sched.id },
        data: { status: 'COMPLETED' },
      });
      continue;
    }

    await db.billingSchedule.update({
      where: { id: sched.id },
      data: { nextDueDate: nextDate },
    });
  }

  return generatedInvoices;
}

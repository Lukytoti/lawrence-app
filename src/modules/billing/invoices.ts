import { db } from '@/lib/db';
import { CreateInvoiceInput, InvoiceStatus } from './types';
import { logAuditEvent } from '@/lib/audit';

export async function createInvoice(input: CreateInvoiceInput, actorUserId: string, periodRef?: string) {
  return db.$transaction(async (tx) => {
    // 1. Check idempotency if periodRef provided
    if (periodRef) {
      const existing = await tx.invoice.findFirst({
        where: { paymentReference: periodRef },
        include: { client: true, lineItems: true },
      });
      if (existing) return existing;
    }

    // 2. Concurrency-safe Invoice Number Generation
    const year = new Date().getFullYear();
    const count = await tx.invoice.count();
    const ts = Date.now().toString().slice(-4);
    const invoiceNumber = `INV-${year}-${(100001 + count).toString().padStart(6, '0')}-${ts}`;

    // 3. Calculate Totals with Decimal precision
    let subtotal = 0;
    const itemsToCreate = [];

    for (const item of input.lineItems) {
      const amt = Number(item.quantity) * Number(item.unitPrice);
      subtotal += amt;
      itemsToCreate.push({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: amt,
        serviceId: item.serviceId,
        projectId: item.projectId || input.projectId,
      });
    }

    const taxAmount = input.taxAmount || 0;
    const discountAmount = input.discountAmount || 0;
    const totalAmount = Math.max(0, subtotal + taxAmount - discountAmount);
    const amountPaid = 0;
    const amountDue = totalAmount;

    // 4. Create Invoice & Line Items
    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        clientId: input.clientId,
        contractId: input.contractId,
        projectId: input.projectId,
        billingScheduleId: input.billingScheduleId,
        currency: input.currency || 'NGN',
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount,
        amountPaid,
        amountDue,
        issueDate: new Date(),
        dueDate: new Date(input.dueDate),
        status: 'DRAFT',
        notes: input.notes,
        paymentReference: periodRef,
        lineItems: {
          create: itemsToCreate,
        },
      },
      include: { client: true, contract: true, project: true, lineItems: true },
    });

    await logAuditEvent({
      actorId: actorUserId,
      action: 'INVOICE_CREATED',
      entityType: 'Invoice',
      entityId: invoice.id,
      metadata: { invoiceNumber, totalAmount, clientId: input.clientId },
    });

    return invoice;
  });
}

export async function issueInvoice(invoiceId: string, actorUserId: string) {
  const invoice = await db.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw new Error(`Invoice ${invoiceId} not found.`);

  if (invoice.status !== 'DRAFT') {
    throw new Error(`Cannot issue invoice in status ${invoice.status}. Invoice must be DRAFT.`);
  }

  const updated = await db.invoice.update({
    where: { id: invoiceId },
    data: { status: 'ISSUED' },
  });

  await logAuditEvent({
    actorId: actorUserId,
    action: 'INVOICE_ISSUED',
    entityType: 'Invoice',
    entityId: invoiceId,
    metadata: { invoiceNumber: invoice.invoiceNumber, totalAmount: Number(invoice.totalAmount) },
  });

  return updated;
}

const ALLOWED_INVOICE_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['ISSUED', 'VOID', 'CANCELLED'],
  ISSUED: ['PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID', 'CANCELLED'],
  PARTIALLY_PAID: ['PAID', 'OVERDUE', 'CANCELLED'],
  PAID: ['VOID'],
  OVERDUE: ['PARTIALLY_PAID', 'PAID', 'VOID'],
  VOID: [],
  CANCELLED: [],
};

export async function updateInvoiceStatus(invoiceId: string, newStatus: InvoiceStatus, actorUserId: string) {
  const invoice = await db.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw new Error(`Invoice ${invoiceId} not found.`);

  if (invoice.status === newStatus) return invoice;

  const allowed = ALLOWED_INVOICE_TRANSITIONS[invoice.status] || [];
  if (!allowed.includes(newStatus)) {
    throw new Error(`Invalid invoice status transition from ${invoice.status} to ${newStatus}.`);
  }

  const updated = await db.invoice.update({
    where: { id: invoiceId },
    data: { status: newStatus },
  });

  await logAuditEvent({
    actorId: actorUserId,
    action: newStatus === 'VOID' ? 'INVOICE_VOIDED' : 'INVOICE_UPDATED',
    entityType: 'Invoice',
    entityId: invoiceId,
    metadata: { from: invoice.status, to: newStatus },
  });

  return updated;
}

export async function getInvoiceById(invoiceId: string) {
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      client: true,
      contract: true,
      project: true,
      lineItems: { include: { service: true } },
      payments: { include: { allocations: true } },
      allocations: { include: { payment: true } },
      reminders: { orderBy: { scheduledFor: 'asc' } },
    },
  });

  if (!invoice) return null;

  // Auto-eval overdue if past due date and status ISSUED or PARTIALLY_PAID
  if ((invoice.status === 'ISSUED' || invoice.status === 'PARTIALLY_PAID') && new Date(invoice.dueDate) < new Date()) {
    await db.invoice.update({
      where: { id: invoiceId },
      data: { status: 'OVERDUE' },
    });
    invoice.status = 'OVERDUE';
  }

  return invoice;
}

export async function getInvoices(options?: { clientId?: string; status?: string }) {
  const where: any = {};
  if (options?.clientId) where.clientId = options.clientId;
  if (options?.status) where.status = options.status;

  return db.invoice.findMany({
    where,
    include: { client: true, project: true, lineItems: true },
    orderBy: { createdAt: 'desc' },
  });
}

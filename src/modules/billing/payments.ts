import { db } from '@/lib/db';
import { RecordPaymentInput, AllocatePaymentInput, PaymentStatus } from './types';
import { logAuditEvent } from '@/lib/audit';

export async function recordPayment(input: RecordPaymentInput, actorUserId: string) {
  return db.$transaction(async (tx) => {
    // 1. Idempotency Check on providerTransactionId
    if (input.providerTransactionId) {
      const existing = await tx.payment.findUnique({
        where: { providerTransactionId: input.providerTransactionId },
        include: { allocations: true },
      });
      if (existing) {
        return { payment: existing, newlyCreated: false };
      }
    }

    // 2. Generate Unique Payment Reference
    const count = await tx.payment.count();
    const year = new Date().getFullYear();
    const ts = Date.now().toString().slice(-4);
    const paymentReference = `PAY-${year}-${10001 + count}-${ts}`;

    // 3. Create Payment Record
    const payment = await tx.payment.create({
      data: {
        paymentReference,
        clientId: input.clientId,
        invoiceId: input.invoiceId,
        amount: input.amount,
        currency: input.currency || 'NGN',
        paymentMethod: input.paymentMethod || 'BANK_TRANSFER',
        provider: input.provider || 'MANUAL',
        providerTransactionId: input.providerTransactionId,
        status: 'PENDING',
        receivedAt: input.receivedAt ? new Date(input.receivedAt) : undefined,
      },
      include: { client: true, invoice: true },
    });

    // 4. Auto-allocate to target invoice if invoiceId provided
    if (input.invoiceId) {
      await allocatePaymentToInvoice(
        {
          paymentId: payment.id,
          invoiceId: input.invoiceId,
          amount: input.amount,
        },
        actorUserId,
        tx
      );
    }

    await logAuditEvent({
      actorId: actorUserId,
      action: 'PAYMENT_CREATED',
      entityType: 'Payment',
      entityId: payment.id,
      metadata: { paymentReference, amount: input.amount, clientId: input.clientId },
    });

    return { payment, newlyCreated: true };
  });
}

export async function allocatePaymentToInvoice(
  input: AllocatePaymentInput,
  actorUserId: string,
  txClient: any = null
) {
  const runner = async (tx: any) => {
    await tx.$executeRaw`SELECT id FROM "Invoice" WHERE id = ${input.invoiceId} FOR UPDATE;`;
    await tx.$executeRaw`SELECT id FROM "Payment" WHERE id = ${input.paymentId} FOR UPDATE;`;

    const payment = await tx.payment.findUnique({
      where: { id: input.paymentId },
      include: { allocations: true },
    });

    if (!payment) throw new Error(`Payment ${input.paymentId} not found.`);

    const invoice = await tx.invoice.findUnique({
      where: { id: input.invoiceId },
    });

    if (!invoice) throw new Error(`Invoice ${input.invoiceId} not found.`);

    // Currency matching check
    if (payment.currency !== invoice.currency) {
      throw new Error(
        `Currency mismatch error: Payment currency (${payment.currency}) does not match Invoice currency (${invoice.currency}).`
      );
    }

    // Allocation bounds validation
    const existingAllocated = payment.allocations.reduce((sum: number, a: any) => sum + Number(a.amount), 0);
    const remainingPaymentAmount = Number(payment.amount) - existingAllocated;

    if (input.amount > remainingPaymentAmount) {
      throw new Error(
        `Allocation amount ${input.amount} exceeds unallocated payment balance ${remainingPaymentAmount}.`
      );
    }

    const invoiceAmountDue = Number(invoice.amountDue);
    if (input.amount > invoiceAmountDue) {
      throw new Error(
        `Allocation amount ${input.amount} exceeds invoice outstanding amount ${invoiceAmountDue}.`
      );
    }

    // Create PaymentAllocation
    const allocation = await tx.paymentAllocation.create({
      data: {
        paymentId: input.paymentId,
        invoiceId: input.invoiceId,
        amount: input.amount,
      },
    });

    // Transactionally update Invoice amountPaid and amountDue
    const newAmountPaid = Number(invoice.amountPaid) + input.amount;
    const newAmountDue = Math.max(0, Number(invoice.totalAmount) - newAmountPaid);
    const newInvoiceStatus = newAmountDue === 0 ? 'PAID' : 'PARTIALLY_PAID';

    await tx.invoice.update({
      where: { id: input.invoiceId },
      data: {
        amountPaid: newAmountPaid,
        amountDue: newAmountDue,
        status: newInvoiceStatus,
      },
    });

    return allocation;
  };

  if (txClient && txClient !== db) {
    return runner(txClient);
  } else {
    return db.$transaction(runner);
  }
}

export async function updatePaymentStatus(
  paymentId: string,
  newStatus: PaymentStatus,
  actorUserId: string
) {
  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new Error(`Payment ${paymentId} not found.`);

  const receivedAt = newStatus === 'SUCCEEDED' ? new Date() : undefined;
  const reconciledAt = newStatus === 'RECONCILED' ? new Date() : undefined;

  const updated = await db.payment.update({
    where: { id: paymentId },
    data: {
      status: newStatus,
      receivedAt: receivedAt || payment.receivedAt,
      reconciledAt: reconciledAt || payment.reconciledAt,
    },
  });

  await logAuditEvent({
    actorId: actorUserId,
    action: newStatus === 'SUCCEEDED' ? 'PAYMENT_SUCCEEDED' : 'PAYMENT_UPDATED',
    entityType: 'Payment',
    entityId: paymentId,
    metadata: { from: payment.status, to: newStatus },
  });

  return updated;
}

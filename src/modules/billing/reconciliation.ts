import { db } from '@/lib/db';
import { processSuccessfulPaymentAndPostLedger } from './service';
import { logAuditEvent } from '@/lib/audit';

export async function reconcilePayment(paymentId: string, actorUserId: string) {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) throw new Error(`Payment ${paymentId} not found.`);

  // Find corresponding Prompt 05 JournalTransaction by referenceNo
  const journalTxn = await db.journalTransaction.findFirst({
    where: { referenceNo: payment.paymentReference, status: 'POSTED' },
    include: { entries: true },
  });

  if (!journalTxn) {
    // If not posted to ledger yet, invoke processSuccessfulPaymentAndPostLedger
    return processSuccessfulPaymentAndPostLedger(paymentId, actorUserId);
  }

  // Verify amount matching
  const totalAmount = journalTxn.entries
    .filter((e) => e.entryType === 'DEBIT')
    .reduce((sum, e) => sum + Number(e.amount), 0);
  if (Math.abs(totalAmount - Number(payment.amount)) > 0.01) {
    await logAuditEvent({
      actorId: actorUserId,
      action: 'RECONCILIATION_EXCEPTION_CREATED',
      entityType: 'Payment',
      entityId: paymentId,
      metadata: {
        reason: 'AMOUNT_MISMATCH',
        paymentAmount: Number(payment.amount),
        ledgerAmount: totalAmount,
      },
    });

    throw new Error(
      `Reconciliation Mismatch Exception: Payment amount (${payment.amount}) does not match Ledger amount (${totalAmount}).`
    );
  }

  const updatedPayment = await db.payment.update({
    where: { id: paymentId },
    data: { status: 'RECONCILED', reconciledAt: new Date() },
  });

  await logAuditEvent({
    actorId: actorUserId,
    action: 'PAYMENT_RECONCILED',
    entityType: 'Payment',
    entityId: paymentId,
    metadata: { paymentReference: payment.paymentReference },
  });

  return { payment: updatedPayment, journalTxn };
}

export async function getUnreconciledPayments() {
  return db.payment.findMany({
    where: {
      status: { in: ['PENDING', 'PROCESSING', 'SUCCEEDED'] },
    },
    include: { client: true, invoice: true },
    orderBy: { createdAt: 'desc' },
  });
}

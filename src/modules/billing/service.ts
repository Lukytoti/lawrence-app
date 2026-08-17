import { db } from '@/lib/db';
import { postJournalTransaction, getOrCreateFinancialAccount } from '@/modules/finance/service';
import { logAuditEvent } from '@/lib/audit';
import { eventBus } from '@/lib/events';

/**
 * Core Billing Orchestration Service connecting Billing Payment to Prompt 05 Financial Ledger.
 * SAFEGUARD: Does NOT directly create/update FinancialAccount or JournalEntry tables.
 * Invokes Prompt 05's authoritative postJournalTransaction() service API.
 */
export async function processSuccessfulPaymentAndPostLedger(
  paymentId: string,
  actorUserId: string
) {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { client: true, invoice: true, allocations: true },
  });

  if (!payment) throw new Error(`Payment ${paymentId} not found.`);

  // Update payment status to SUCCEEDED if PENDING
  if (payment.status === 'PENDING' || payment.status === 'PROCESSING') {
    await db.payment.update({
      where: { id: paymentId },
      data: { status: 'SUCCEEDED', receivedAt: new Date() },
    });
  }

  // Resolve Prompt 05 Accounts for Debit and Credit
  const currency = payment.currency || 'NGN';

  // Bank Account (Asset/Bank)
  const bankAccount = await getOrCreateFinancialAccount(
    null,
    `BANK_ACCOUNT_PRIMARY_${currency}`,
    'ASSET',
    'BANK',
    currency
  );

  // Client Revenue Account (Revenue)
  const revenueAccount = await getOrCreateFinancialAccount(
    null,
    `CLIENT_REVENUE_DIGITAL_${currency}`,
    'REVENUE',
    'CLIENT_SERVICES',
    currency
  );

  // Invoke Prompt 05 Financial Ledger Posting API cleanly
  const journalTxn = await postJournalTransaction({
    referenceNo: payment.paymentReference,
    businessDomain: 'DIGITAL_MARKETING',
    sourceType: 'CLIENT_PAYMENT',
    sourceEntityId: payment.id,
    currency,
    description: `Payment received from ${payment.client.companyName || payment.client.contactName} (${payment.paymentReference})`,
    createdBy: actorUserId,
    entries: [
      {
        accountId: bankAccount.id,
        entryType: 'DEBIT',
        amount: Number(payment.amount),
        description: `Bank deposit for payment ${payment.paymentReference}`,
      },
      {
        accountId: revenueAccount.id,
        entryType: 'CREDIT',
        amount: Number(payment.amount),
        description: `Client digital service revenue for payment ${payment.paymentReference}`,
      },
    ],
  });

  // Mark Payment as RECONCILED
  const reconciledPayment = await db.payment.update({
    where: { id: paymentId },
    data: {
      status: 'RECONCILED',
      reconciledAt: new Date(),
    },
  });

  await logAuditEvent({
    actorId: actorUserId,
    action: 'PAYMENT_RECONCILED',
    entityType: 'Payment',
    entityId: paymentId,
    metadata: {
      paymentReference: payment.paymentReference,
      journalTransactionNo: journalTxn.transactionNo,
      amount: Number(payment.amount),
    },
  });

  await eventBus.publish(
    'JournalTransactionPosted',
    {
      paymentId: payment.id,
      clientId: payment.clientId,
      amount: Number(payment.amount),
      currency: payment.currency,
      journalTransactionId: journalTxn.id,
    },
    actorUserId
  );

  return { payment: reconciledPayment, journalTxn };
}

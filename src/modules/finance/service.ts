import { db } from '@/lib/db';
import { eventBus } from '@/lib/events';
import { logAuditEvent } from '@/lib/audit';
import { calculateAccountBalance } from './rules';
import {
  EntryType,
  LedgerCategory,
  BusinessDomain,
  FinancialAccountSummary,
  LedgerEntryPayload,
} from './types';

/**
 * Get or create financial account for a member/system code in a target currency.
 */
export async function getOrCreateFinancialAccount(
  memberId: string | null,
  accountCode: string,
  accountType = 'LIABILITY',
  accountSubtype = 'MEMBER_PAYABLE',
  currency = 'NGN'
) {
  let account = await db.financialAccount.findUnique({
    where: { accountCode },
  });

  if (!account) {
    account = await db.financialAccount.create({
      data: {
        accountCode,
        memberId: memberId || undefined,
        accountType,
        accountSubtype,
        currency,
        status: 'ACTIVE',
      },
    });
  }

  return account;
}

/**
 * Calculate member financial wallet summary & derived balances within optional transaction.
 * Formula:
 * Ledger Balance = SUM(CREDIT) - SUM(DEBIT)
 * Reserved Funds = SUM(PaymentRequest in PENDING, APPROVED, PROCESSING)
 * Available Balance = Ledger Balance - Reserved Funds
 */
export async function getMemberWalletSummary(
  memberId: string,
  currency = 'NGN',
  domain?: BusinessDomain,
  txClient: any = db
): Promise<FinancialAccountSummary> {
  const accountCode = domain
    ? `MEMBER_EARNINGS_${domain}_${memberId}_${currency}`
    : `MEMBER_EARNINGS_NETWORK_${memberId}_${currency}`;

  const account = await getOrCreateFinancialAccount(memberId, accountCode, 'LIABILITY', 'MEMBER_PAYABLE', currency);

  // Derived balance from JournalEntry records
  const entries = await txClient.journalEntry.findMany({
    where: {
      accountId: account.id,
      transaction: { status: 'POSTED' },
    },
  });

  let totalCredits = 0;
  let totalDebits = 0;

  for (const e of entries) {
    const val = Number(e.amount);
    if (e.entryType === 'CREDIT') totalCredits += val;
    else if (e.entryType === 'DEBIT') totalDebits += val;
  }

  const ledgerBalance = totalCredits - totalDebits;

  // Calculate Reserved Funds from active payout requests
  const pendingRequests = await txClient.paymentRequest.findMany({
    where: {
      memberId,
      currency,
      status: { in: ['PENDING', 'APPROVED', 'PROCESSING'] },
    },
  });

  let reservedFunds = 0;
  for (const pr of pendingRequests) {
    reservedFunds += Number(pr.amount);
  }

  const availableBalance = Math.max(0, ledgerBalance - reservedFunds);

  return {
    id: account.id,
    memberId: memberId,
    currency,
    accountType: account.accountType,
    status: account.status,
    balance: Math.round(availableBalance * 10000) / 10000,
    totalCredits: Math.round(totalCredits * 10000) / 10000,
    totalDebits: Math.round(totalDebits * 10000) / 10000,
  };
}

/**
 * Post a balanced Double-Entry Journal Transaction.
 * Invariant: SUM(DEBITS) === SUM(CREDITS) before transaction is committed.
 */
export async function postJournalTransaction(input: {
  transactionNo?: string;
  referenceNo?: string;
  businessDomain?: BusinessDomain;
  sourceType: string;
  sourceEntityId?: string;
  currency?: string;
  description: string;
  createdBy: string;
  entries: Array<{
    accountId: string;
    memberId?: string;
    entryType: EntryType;
    amount: number;
    description?: string;
    relatedEntryId?: string;
  }>;
}) {
  const currency = input.currency || 'NGN';
  const businessDomain = input.businessDomain || 'NETWORK_MARKETING';
  const transactionNo = input.transactionNo || `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  // Idempotency check on referenceNo if provided
  if (input.referenceNo) {
    const existing = await db.journalTransaction.findFirst({
      where: { referenceNo: input.referenceNo, status: 'POSTED' },
      include: { entries: true },
    });
    if (existing) {
      return existing;
    }
  }

  // Validate entry array presence
  if (!input.entries || input.entries.length === 0) {
    throw new Error('Malformed journal: Transaction must contain at least two entries.');
  }

  // Validate Double-Entry Balancing Invariant & Currency Uniformity
  let totalDebits = 0;
  let totalCredits = 0;

  for (const e of input.entries) {
    if (e.amount <= 0) {
      throw new Error(`Invalid entry amount: ${e.amount}. Amounts must be strictly positive.`);
    }
    if (e.entryType === 'DEBIT') totalDebits += e.amount;
    else if (e.entryType === 'CREDIT') totalCredits += e.amount;
    else throw new Error(`Invalid entry type: ${e.entryType}. Must be DEBIT or CREDIT.`);
  }

  const diff = Math.abs(totalDebits - totalCredits);
  if (diff > 0.0001) {
    throw new Error(`Unbalanced journal transaction: Total Debits (${totalDebits}) must equal Total Credits (${totalCredits}).`);
  }

  // Create transaction in atomic PostgreSQL transaction
  const txn = await db.$transaction(async (tx) => {
    const journal = await tx.journalTransaction.create({
      data: {
        transactionNo,
        referenceNo: input.referenceNo,
        businessDomain,
        sourceType: input.sourceType,
        sourceEntityId: input.sourceEntityId,
        currency,
        status: 'POSTED',
        description: input.description,
        createdBy: input.createdBy,
        entries: {
          create: input.entries.map((e) => ({
            accountId: e.accountId,
            memberId: e.memberId,
            entryType: e.entryType,
            amount: e.amount,
            currency,
            description: e.description || input.description,
            relatedEntryId: e.relatedEntryId,
          })),
        },
      },
      include: { entries: true },
    });

    return journal;
  });

  await eventBus.publish('JournalTransactionPosted', { transactionId: txn.id, transactionNo }, input.createdBy);

  const actorUser = await db.user.findUnique({ where: { id: input.createdBy } });
  if (actorUser) {
    await logAuditEvent({
      actorId: input.createdBy,
      action: 'JOURNAL_POSTED',
      entityType: 'JournalTransaction',
      entityId: txn.id,
      metadata: { transactionNo, sourceType: input.sourceType, totalAmount: totalDebits },
    });
  }

  return txn;
}

/**
 * Generic Future-Facing Earning Poster API.
 * Debit Company Expense / Revenue Source, Credit Member Wallet.
 */
export async function postEarning(input: {
  memberId: string;
  domain: BusinessDomain;
  earningType: string;
  amount: number;
  currency?: string;
  sourceEntityType?: string;
  sourceEntityId?: string;
  description: string;
  createdBy: string;
}) {
  const currency = input.currency || 'NGN';
  const memberAccountCode = `MEMBER_EARNINGS_${input.domain}_${input.memberId}_${currency}`;
  const memberAccount = await getOrCreateFinancialAccount(input.memberId, memberAccountCode, 'LIABILITY', 'MEMBER_PAYABLE', currency);

  const companyExpenseCode = `COMPANY_EXPENSE_${input.domain}_${currency}`;
  const companyAccount = await getOrCreateFinancialAccount(null, companyExpenseCode, 'EXPENSE', `${input.domain}_EXPENSE`, currency);

  const txn = await postJournalTransaction({
    referenceNo: input.sourceEntityId,
    businessDomain: input.domain,
    sourceType: input.earningType,
    sourceEntityId: input.sourceEntityId,
    currency,
    description: input.description,
    createdBy: input.createdBy,
    entries: [
      { accountId: companyAccount.id, entryType: 'DEBIT', amount: input.amount, description: input.description },
      { accountId: memberAccount.id, memberId: input.memberId, entryType: 'CREDIT', amount: input.amount, description: input.description },
    ],
  });

  await eventBus.publish('EarningCreated', { memberId: input.memberId, amount: input.amount, currency, domain: input.domain }, input.createdBy);

  return txn;
}

/**
 * Single-sided poster compatibility wrapper that posts balanced journal entries.
 */
export async function postLedgerEntry(input: {
  memberId: string;
  currency?: string;
  entryType: EntryType;
  category: LedgerCategory;
  businessDomain?: BusinessDomain;
  amount: number;
  description: string;
  referenceId?: string;
  relatedEntryId?: string;
  createdBy: string;
}) {
  const currency = input.currency || 'NGN';
  const memberAccountCode = `MEMBER_EARNINGS_NETWORK_${input.memberId}_${currency}`;
  const memberAccount = await getOrCreateFinancialAccount(input.memberId, memberAccountCode, 'LIABILITY', 'MEMBER_PAYABLE', currency);

  const systemAccountCode = `COMPANY_EXPENSE_${input.businessDomain || 'NETWORK'}_${currency}`;
  const systemAccount = await getOrCreateFinancialAccount(null, systemAccountCode, 'EXPENSE', 'NETWORK_EXPENSE', currency);

  const entries: any[] = [];
  if (input.entryType === 'CREDIT') {
    entries.push({ accountId: systemAccount.id, entryType: 'DEBIT', amount: input.amount, description: input.description });
    entries.push({ accountId: memberAccount.id, memberId: input.memberId, entryType: 'CREDIT', amount: input.amount, description: input.description, relatedEntryId: input.relatedEntryId });
  } else {
    const cashAccount = await getOrCreateFinancialAccount(null, `COMPANY_CASH_${currency}`, 'ASSET', 'COMPANY_CASH', currency);
    entries.push({ accountId: memberAccount.id, memberId: input.memberId, entryType: 'DEBIT', amount: input.amount, description: input.description, relatedEntryId: input.relatedEntryId });
    entries.push({ accountId: cashAccount.id, entryType: 'CREDIT', amount: input.amount, description: input.description });
  }

  const txn = await postJournalTransaction({
    referenceNo: input.referenceId,
    businessDomain: input.businessDomain || 'NETWORK_MARKETING',
    sourceType: input.category,
    currency,
    description: input.description,
    createdBy: input.createdBy,
    entries,
  });

  const compatEntry = await db.ledgerEntry.create({
    data: {
      accountId: memberAccount.id,
      memberId: input.memberId,
      entryType: input.entryType,
      category: input.category,
      businessDomain: input.businessDomain || 'NETWORK_MARKETING',
      amount: input.amount,
      currency,
      status: 'POSTED',
      description: input.description,
      referenceId: input.referenceId,
      relatedEntryId: input.relatedEntryId,
      createdBy: input.createdBy,
    },
  });

  return compatEntry;
}

/**
 * Post offsetting financial adjustment.
 */
export async function postFinancialAdjustment(input: {
  originalEntryId: string;
  adjustmentType: 'CREDIT' | 'DEBIT';
  amount: number;
  reason: string;
  adminId: string;
}) {
  if (!input.reason || input.reason.trim().length === 0) {
    throw new Error('Adjustment reason is mandatory.');
  }

  const original = await db.ledgerEntry.findUnique({
    where: { id: input.originalEntryId },
  });

  if (!original) {
    throw new Error(`Original entry not found: ${input.originalEntryId}`);
  }

  const category = input.adjustmentType === 'CREDIT' ? 'ADJUSTMENT_CREDIT' : 'ADJUSTMENT_DEBIT';

  const entry = await postLedgerEntry({
    memberId: original.memberId,
    currency: original.currency,
    entryType: input.adjustmentType,
    category,
    businessDomain: original.businessDomain as any,
    amount: input.amount,
    description: `Adjustment for Entry #${original.id}: ${input.reason}`,
    relatedEntryId: original.id,
    createdBy: input.adminId,
  });

  await eventBus.publish('FinancialAdjustmentPosted', { originalEntryId: original.id, amount: input.amount, reason: input.reason }, input.adminId);

  return entry;
}

/**
 * Create withdrawal payment request in PENDING status with Pessimistic Row Locking (FOR UPDATE).
 * This guarantees race-condition safety against simultaneous withdrawal requests.
 */
export async function createPaymentRequest(input: {
  memberId: string;
  currency?: string;
  amount: number;
  payoutMethod: string;
  payoutDetails: Record<string, any>;
}) {
  if (input.amount <= 0) {
    throw new Error('Payment request amount must be strictly greater than zero.');
  }

  const currency = input.currency || 'NGN';
  const accountCode = `MEMBER_EARNINGS_NETWORK_${input.memberId}_${currency}`;

  // Execute in isolated PostgreSQL transaction with row-level locking
  const request = await db.$transaction(async (tx) => {
    // Acquire financial account record
    const account = await getOrCreateFinancialAccount(input.memberId, accountCode, 'LIABILITY', 'MEMBER_PAYABLE', currency);

    // Apply PostgreSQL row-level pessimistic lock (SELECT ... FOR UPDATE)
    await tx.$executeRaw`SELECT id FROM "FinancialAccount" WHERE id = ${account.id} FOR UPDATE;`;

    // Recalculate available balance under row-level lock
    const summary = await getMemberWalletSummary(input.memberId, currency, undefined, tx);

    if (summary.balance < input.amount) {
      throw new Error(`Insufficient available funds. Available: ${summary.balance}, Requested: ${input.amount}`);
    }

    const req = await tx.paymentRequest.create({
      data: {
        memberId: input.memberId,
        accountId: account.id,
        amount: input.amount,
        currency,
        payoutMethod: input.payoutMethod,
        payoutDetailsJson: JSON.stringify(input.payoutDetails),
        status: 'PENDING',
      },
    });

    return req;
  });

  await eventBus.publish('PaymentRequestCreated', { requestId: request.id, memberId: input.memberId, amount: input.amount }, input.memberId);

  const memberRec = await db.networkMember.findUnique({
    where: { id: input.memberId },
    select: { userId: true },
  });

  if (memberRec?.userId) {
    await logAuditEvent({
      actorId: memberRec.userId,
      action: 'PAYMENT_REQUEST_CREATED',
      entityType: 'PaymentRequest',
      entityId: request.id,
      metadata: { memberId: input.memberId, amount: input.amount, currency },
    });
  }

  return request;
}

/**
 * Admin approval of payment request (Idempotent & Atomic).
 */
export async function approvePaymentRequest(requestId: string, adminId: string) {
  return db.$transaction(async (tx) => {
    // Lock payment request row FOR UPDATE
    const reqs: any[] = await tx.$queryRaw`SELECT * FROM "PaymentRequest" WHERE id = ${requestId} FOR UPDATE;`;
    const req = reqs[0];

    if (!req || req.status !== 'PENDING') {
      throw new Error('Payment request not found or not in PENDING status.');
    }

    // Post DEBIT withdrawal entry
    const entry = await postLedgerEntry({
      memberId: req.memberId,
      currency: req.currency,
      entryType: 'DEBIT',
      category: 'WITHDRAWAL',
      businessDomain: 'NETWORK_MARKETING',
      amount: Number(req.amount),
      description: `Withdrawal payout approval (Request #${req.id})`,
      referenceId: req.id,
      createdBy: adminId,
    });

    const updatedReq = await tx.paymentRequest.update({
      where: { id: requestId },
      data: {
        ledgerEntryId: entry.id,
        status: 'PROCESSED',
        processedAt: new Date(),
        processedBy: adminId,
      },
    });

    await eventBus.publish('PaymentRequestApproved', { requestId, adminId, amount: Number(req.amount) }, adminId);

    await logAuditEvent({
      actorId: adminId,
      action: 'PAYMENT_REQUEST_APPROVED',
      entityType: 'PaymentRequest',
      entityId: requestId,
      metadata: { amount: Number(req.amount) },
    });

    return updatedReq;
  });
}

/**
 * Admin rejection of payment request with mandatory rejection reason.
 */
export async function rejectPaymentRequest(requestId: string, rejectionReason: string, adminId: string) {
  if (!rejectionReason || rejectionReason.trim().length === 0) {
    throw new Error('Rejection reason is required.');
  }

  return db.$transaction(async (tx) => {
    const reqs: any[] = await tx.$queryRaw`SELECT * FROM "PaymentRequest" WHERE id = ${requestId} FOR UPDATE;`;
    const req = reqs[0];

    if (!req || req.status !== 'PENDING') {
      throw new Error('Payment request not found or not in PENDING status.');
    }

    const updatedReq = await tx.paymentRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        rejectionReason,
        processedAt: new Date(),
        processedBy: adminId,
      },
    });

    await eventBus.publish('PaymentRequestRejected', { requestId, adminId, rejectionReason }, adminId);

    await logAuditEvent({
      actorId: adminId,
      action: 'PAYMENT_REQUEST_REJECTED',
      entityType: 'PaymentRequest',
      entityId: requestId,
      metadata: { rejectionReason },
    });

    return updatedReq;
  });
}

/**
 * Member cancellation of payment request (releases reserved funds).
 */
export async function cancelPaymentRequest(requestId: string, memberId: string) {
  return db.$transaction(async (tx) => {
    const reqs: any[] = await tx.$queryRaw`SELECT * FROM "PaymentRequest" WHERE id = ${requestId} FOR UPDATE;`;
    const req = reqs[0];

    if (!req || req.memberId !== memberId || req.status !== 'PENDING') {
      throw new Error('Payment request not found or cannot be cancelled.');
    }

    const updatedReq = await tx.paymentRequest.update({
      where: { id: requestId },
      data: {
        status: 'CANCELLED',
        processedAt: new Date(),
      },
    });

    const memberRec = await tx.networkMember.findUnique({
      where: { id: memberId },
      select: { userId: true },
    });

    if (memberRec?.userId) {
      await logAuditEvent({
        actorId: memberRec.userId,
        action: 'PAYMENT_REQUEST_CANCELLED',
        entityType: 'PaymentRequest',
        entityId: requestId,
        metadata: { amount: Number(req.amount) },
      });
    }

    return updatedReq;
  });
}

/**
 * File transaction dispute.
 */
export async function fileDispute(input: {
  paymentRequestId?: string;
  ledgerEntryId?: string;
  disputedBy: string;
  reason: string;
}) {
  if (!input.reason || input.reason.trim().length === 0) {
    throw new Error('Dispute reason is mandatory.');
  }

  const dispute = await db.financialDispute.create({
    data: {
      paymentRequestId: input.paymentRequestId,
      ledgerEntryId: input.ledgerEntryId,
      disputedBy: input.disputedBy,
      reason: input.reason,
      status: 'OPEN',
    },
  });

  await eventBus.publish('PaymentRequestDisputed', { disputeId: dispute.id, reason: input.reason }, input.disputedBy);

  await logAuditEvent({
    actorId: input.disputedBy,
    action: 'PAYMENT_REQUEST_DISPUTED',
    entityType: 'FinancialDispute',
    entityId: dispute.id,
    metadata: { reason: input.reason },
  });

  return dispute;
}

/**
 * Resolve dispute.
 */
export async function resolveDispute(
  disputeId: string,
  adminId: string,
  resolution: 'RESOLVED' | 'REJECTED',
  resolutionNotes?: string
) {
  const dispute = await db.financialDispute.update({
    where: { id: disputeId },
    data: {
      status: resolution,
      resolutionNotes,
      resolvedBy: adminId,
      resolvedAt: new Date(),
    },
  });

  await logAuditEvent({
    actorId: adminId,
    action: 'DISPUTE_RESOLVED',
    entityType: 'FinancialDispute',
    entityId: disputeId,
    metadata: { resolution, resolutionNotes },
  });

  return dispute;
}

/**
 * Balance Reconciliation Test Helper.
 * Reconstructs balance strictly from JournalEntry records and asserts exact equality.
 */
export async function reconcileMemberBalance(memberId: string, currency = 'NGN', domain?: BusinessDomain) {
  const summary = await getMemberWalletSummary(memberId, currency, domain);

  const accountCode = domain
    ? `MEMBER_EARNINGS_${domain}_${memberId}_${currency}`
    : `MEMBER_EARNINGS_NETWORK_${memberId}_${currency}`;

  const account = await db.financialAccount.findUnique({ where: { accountCode } });
  if (!account) return { isReconciled: true, diff: 0, balance: 0 };

  const entries = await db.journalEntry.findMany({
    where: {
      accountId: account.id,
      transaction: { status: 'POSTED' },
    },
  });

  let credits = 0;
  let debits = 0;
  for (const e of entries) {
    const val = Number(e.amount);
    if (e.entryType === 'CREDIT') credits += val;
    else if (e.entryType === 'DEBIT') debits += val;
  }

  const rawLedgerBalance = credits - debits;
  const pendingRequests = await db.paymentRequest.findMany({
    where: {
      memberId,
      currency,
      status: { in: ['PENDING', 'APPROVED', 'PROCESSING'] },
    },
  });

  let reserved = 0;
  for (const pr of pendingRequests) reserved += Number(pr.amount);

  const calculatedAvailable = Math.max(0, rawLedgerBalance - reserved);
  const diff = Math.abs(calculatedAvailable - summary.balance);

  return {
    isReconciled: diff < 0.0001,
    diff,
    calculatedAvailable,
    serviceAvailable: summary.balance,
  };
}

/**
 * Fetch member ledger history.
 */
export async function getMemberLedgerHistory(memberId: string, currency = 'NGN', domain?: BusinessDomain) {
  const whereClause: any = { memberId, currency };
  if (domain) whereClause.businessDomain = domain;

  return db.ledgerEntry.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
  });
}

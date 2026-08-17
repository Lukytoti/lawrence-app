'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import {
  getMemberWalletSummary,
  postLedgerEntry,
  postFinancialAdjustment,
  createPaymentRequest,
  approvePaymentRequest,
  rejectPaymentRequest,
  cancelPaymentRequest,
  fileDispute,
  resolveDispute,
  getMemberLedgerHistory,
} from './service';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) {
    throw new Error('Unauthorized: Authentication session required.');
  }
  return session?.user as any;
}

export async function fetchMemberWalletAction(currency = 'NGN') {
  const user = await getAuthenticatedUser();
  const member = await db.networkMember.findUnique({
    where: { userId: user.id },
  });

  if (!member) {
    throw new Error('Network member record not found for authenticated user.');
  }

  const authorized = await hasPermission(user.id, 'finance:read_own');
  if (!authorized) {
    throw new Error('Forbidden: Insufficient financial permissions.');
  }

  const wallet = await getMemberWalletSummary(member.id, currency);
  const ledger = await getMemberLedgerHistory(member.id, currency);

  return { wallet, ledger };
}

export async function requestPayoutAction(amount: number, payoutMethod: string, payoutDetails: Record<string, any>, currency = 'NGN') {
  const user = await getAuthenticatedUser();
  const member = await db.networkMember.findUnique({
    where: { userId: user.id },
  });

  if (!member) {
    throw new Error('Network member record not found.');
  }

  const authorized = await hasPermission(user.id, 'finance:read_own');
  if (!authorized) {
    throw new Error('Forbidden: Insufficient financial permissions.');
  }

  const req = await createPaymentRequest({
    memberId: member.id,
    currency,
    amount,
    payoutMethod,
    payoutDetails,
  });

  revalidatePath('/finance/earnings');
  return { success: true, request: req };
}

export async function cancelPayoutAction(requestId: string) {
  const user = await getAuthenticatedUser();
  const member = await db.networkMember.findUnique({
    where: { userId: user.id },
  });

  if (!member) {
    throw new Error('Network member record not found.');
  }

  const authorized = await hasPermission(user.id, 'finance:read_own');
  if (!authorized) {
    throw new Error('Forbidden: Insufficient financial permissions.');
  }

  const result = await cancelPaymentRequest(requestId, member.id);
  revalidatePath('/finance/earnings');
  return { success: true, request: result };
}

export async function approvePayoutAction(requestId: string) {
  const user = await getAuthenticatedUser();

  const authorized = await hasPermission(user.id, 'finance:manage');
  if (!authorized) {
    throw new Error('Forbidden: Insufficient administrative financial permissions (finance:manage).');
  }

  const result = await approvePaymentRequest(requestId, user.id);
  revalidatePath('/finance/transactions');
  return { success: true, request: result };
}

export async function rejectPayoutAction(requestId: string, rejectionReason: string) {
  const user = await getAuthenticatedUser();

  const authorized = await hasPermission(user.id, 'finance:manage');
  if (!authorized) {
    throw new Error('Forbidden: Insufficient administrative financial permissions (finance:manage).');
  }

  const result = await rejectPaymentRequest(requestId, rejectionReason, user.id);
  revalidatePath('/finance/transactions');
  return { success: true, request: result };
}

export async function postAdjustmentAction(originalEntryId: string, adjustmentType: 'CREDIT' | 'DEBIT', amount: number, reason: string) {
  const user = await getAuthenticatedUser();

  const authorized = await hasPermission(user.id, 'finance:manage');
  if (!authorized) {
    throw new Error('Forbidden: Insufficient administrative financial permissions (finance:manage).');
  }

  const result = await postFinancialAdjustment({
    originalEntryId,
    adjustmentType,
    amount,
    reason,
    adminId: user.id,
  });

  revalidatePath('/finance/transactions');
  return { success: true, entry: result };
}

export async function fileDisputeAction(paymentRequestId?: string, ledgerEntryId?: string, reason = '') {
  const user = await getAuthenticatedUser();

  const authorized = await hasPermission(user.id, 'finance:read_own');
  if (!authorized) {
    throw new Error('Forbidden: Insufficient financial permissions.');
  }

  const result = await fileDispute({
    paymentRequestId,
    ledgerEntryId,
    disputedBy: user.id,
    reason,
  });

  revalidatePath('/finance/earnings');
  return { success: true, dispute: result };
}

export async function resolveDisputeAction(disputeId: string, resolution: 'RESOLVED' | 'REJECTED', resolutionNotes?: string) {
  const user = await getAuthenticatedUser();

  const authorized = await hasPermission(user.id, 'finance:manage');
  if (!authorized) {
    throw new Error('Forbidden: Insufficient administrative financial permissions (finance:manage).');
  }

  const result = await resolveDispute(disputeId, user.id, resolution, resolutionNotes);
  revalidatePath('/finance/transactions');
  return { success: true, dispute: result };
}

'use server';

import {
  requireBillingRead,
  requireBillingCreate,
  requireBillingUpdate,
  requireBillingIssue,
  requirePaymentRecord,
  requireBillingReconcile,
} from './permissions';
import { createOrUpdateBillingProfile, getBillingProfileByClientId } from './profiles';
import { createClientContract, updateContractStatus, getClientContracts } from './contracts';
import { createBillingSchedule, processDueBillingSchedules } from './schedules';
import { createInvoice, issueInvoice, updateInvoiceStatus, getInvoiceById, getInvoices } from './invoices';
import { recordPayment, updatePaymentStatus } from './payments';
import { processSuccessfulPaymentAndPostLedger } from './service';
import { reconcilePayment, getUnreconciledPayments } from './reconciliation';
import { ContractStatus, InvoiceStatus } from './types';

export async function fetchInvoicesAction(userId: string, options?: any) {
  await requireBillingRead(userId);
  return getInvoices(options);
}

export async function fetchInvoiceByIdAction(userId: string, invoiceId: string) {
  await requireBillingRead(userId);
  return getInvoiceById(invoiceId);
}

export async function createInvoiceAction(userId: string, input: any) {
  await requireBillingCreate(userId);
  return createInvoice(input, userId);
}

export async function issueInvoiceAction(userId: string, invoiceId: string) {
  await requireBillingIssue(userId);
  return issueInvoice(invoiceId, userId);
}

export async function updateInvoiceStatusAction(userId: string, invoiceId: string, status: InvoiceStatus) {
  await requireBillingUpdate(userId);
  return updateInvoiceStatus(invoiceId, status, userId);
}

export async function createContractAction(userId: string, input: any) {
  await requireBillingCreate(userId);
  return createClientContract(input, userId);
}

export async function updateContractStatusAction(userId: string, contractId: string, status: ContractStatus) {
  await requireBillingUpdate(userId);
  return updateContractStatus(contractId, status, userId);
}

export async function fetchContractsAction(userId: string, clientId?: string) {
  await requireBillingRead(userId);
  return getClientContracts(clientId);
}

export async function createBillingScheduleAction(userId: string, input: any) {
  await requireBillingCreate(userId);
  return createBillingSchedule(input, userId);
}

export async function recordPaymentAction(userId: string, input: any) {
  await requirePaymentRecord(userId);
  const result = await recordPayment(input, userId);
  if (result.payment && result.payment.status === 'SUCCEEDED') {
    await processSuccessfulPaymentAndPostLedger(result.payment.id, userId);
  }
  return result;
}

export async function reconcilePaymentAction(userId: string, paymentId: string) {
  await requireBillingReconcile(userId);
  return reconcilePayment(paymentId, userId);
}

export async function fetchUnreconciledPaymentsAction(userId: string) {
  await requireBillingReconcile(userId);
  return getUnreconciledPayments();
}

export async function saveBillingProfileAction(userId: string, input: any) {
  await requireBillingCreate(userId);
  return createOrUpdateBillingProfile(input, userId);
}

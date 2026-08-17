export type ContractStatus =
  | 'DRAFT'
  | 'PENDING_SIGNATURE'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'TERMINATED'
  | 'CANCELLED';

export type ScheduleFrequency = 'ONE_TIME' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'CUSTOM';

export type InvoiceStatus =
  | 'DRAFT'
  | 'ISSUED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'VOID'
  | 'CANCELLED';

export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'RECONCILED';

export type PaymentMethod = 'BANK_TRANSFER' | 'CARD' | 'DIRECT_DEBIT' | 'MANUAL';

export type PaymentProviderType = 'MANUAL' | 'MOCK' | 'FLUTTERWAVE' | 'PAYSTACK' | 'STRIPE';

export type ReminderType = 'UPCOMING' | 'DUE_TODAY' | 'OVERDUE' | 'FINAL_NOTICE';

export interface CreateBillingProfileInput {
  clientId: string;
  billingName: string;
  billingEmail: string;
  billingPhone?: string;
  billingAddress?: string;
  taxIdentifier?: string;
  currency?: string;
  paymentTermsDays?: number;
  defaultPaymentMethod?: PaymentMethod;
}

export interface CreateContractInput {
  clientId: string;
  crmOpportunityId?: string;
  projectId?: string;
  title: string;
  description?: string;
  contractValue: number;
  currency?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  paymentTerms?: string;
}

export interface CreateBillingScheduleInput {
  contractId?: string;
  projectId?: string;
  frequency: ScheduleFrequency;
  amount: number;
  currency?: string;
  startDate: Date | string;
  endDate?: Date | string;
}

export interface CreateInvoiceInput {
  clientId: string;
  contractId?: string;
  projectId?: string;
  billingScheduleId?: string;
  currency?: string;
  dueDate: Date | string;
  notes?: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    serviceId?: string;
    projectId?: string;
  }>;
  taxAmount?: number;
  discountAmount?: number;
}

export interface RecordPaymentInput {
  clientId: string;
  invoiceId?: string;
  amount: number;
  currency?: string;
  paymentMethod?: PaymentMethod;
  provider?: PaymentProviderType;
  providerTransactionId?: string;
  receivedAt?: Date | string;
}

export interface AllocatePaymentInput {
  paymentId: string;
  invoiceId: string;
  amount: number;
}

export interface BillingDashboardSummary {
  totalBilled: number;
  totalPaid: number;
  totalOutstanding: number;
  overdueAmount: number;
  draftCount: number;
  issuedCount: number;
  paidCount: number;
  overdueCount: number;
  unreconciledCount: number;
  currency: string;
}

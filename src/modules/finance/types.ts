export type EntryType = 'CREDIT' | 'DEBIT';
export type LedgerCategory =
  | 'NETWORK_BONUS'
  | 'OUTSOURCING_PAYOUT'
  | 'WITHDRAWAL'
  | 'ADJUSTMENT_CREDIT'
  | 'ADJUSTMENT_DEBIT'
  | 'FEE';

export type BusinessDomain = 'NETWORK_MARKETING' | 'DIGITAL_MARKETING';
export type PaymentRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISPUTED' | 'PROCESSED';
export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED_APPROVED' | 'RESOLVED_REJECTED';

export interface FinancialAccountSummary {
  id: string;
  memberId: string;
  currency: string;
  accountType: string;
  status: string;
  balance: number;
  totalCredits: number;
  totalDebits: number;
}

export interface LedgerEntryPayload {
  id: string;
  accountId: string;
  memberId: string;
  entryType: EntryType;
  category: LedgerCategory;
  businessDomain: BusinessDomain;
  amount: number;
  currency: string;
  status: string;
  referenceId?: string | null;
  relatedEntryId?: string | null;
  description: string;
  createdBy: string;
  createdAt: Date;
}

export interface PaymentRequestSummary {
  id: string;
  memberId: string;
  accountId: string;
  amount: number;
  currency: string;
  payoutMethod: string;
  payoutDetails: Record<string, any>;
  status: PaymentRequestStatus;
  rejectionReason?: string | null;
  requestedAt: Date;
  processedAt?: Date | null;
}

export interface FinancialDisputeSummary {
  id: string;
  paymentRequestId?: string | null;
  ledgerEntryId?: string | null;
  disputedBy: string;
  reason: string;
  status: DisputeStatus;
  resolutionNotes?: string | null;
  resolvedAt?: Date | null;
}

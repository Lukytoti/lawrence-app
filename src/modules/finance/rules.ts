import { LedgerEntryPayload } from './types';

/**
 * Compute total balance from posted credit and debit ledger entries.
 * Formula: Balance = SUM(CREDIT) - SUM(DEBIT)
 */
export function calculateAccountBalance(entries: LedgerEntryPayload[]): {
  balance: number;
  totalCredits: number;
  totalDebits: number;
} {
  let totalCredits = 0;
  let totalDebits = 0;

  for (const entry of entries) {
    if (entry.status !== 'POSTED') continue;

    if (entry.entryType === 'CREDIT') {
      totalCredits += entry.amount;
    } else if (entry.entryType === 'DEBIT') {
      totalDebits += entry.amount;
    }
  }

  const balance = totalCredits - totalDebits;

  return {
    balance: Math.round(balance * 10000) / 10000,
    totalCredits: Math.round(totalCredits * 10000) / 10000,
    totalDebits: Math.round(totalDebits * 10000) / 10000,
  };
}

/**
 * Format currency amount with symbol.
 */
export function formatCurrencyAmount(amount: number, currency = 'NGN'): string {
  if (currency === 'USD') {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

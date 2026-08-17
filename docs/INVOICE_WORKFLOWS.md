# Invoice Workflows & Lifecycle Engine

## 1. End-to-End Billing Lifecycle
1. **CRM Opportunity Won**: Commercial opportunity is won in CRM (Prompt 06).
2. **Digital Project Created**: Converted into `DigitalProject` (Prompt 10).
3. **Contract Created**: `ClientContract` generated with contract value metadata and payment terms.
4. **Billing Schedule**: Recurring or one-time `BillingSchedule` configured (`MONTHLY`, `QUARTERLY`, etc.).
5. **Invoice Generation**: Concurrency-safe invoice created (`INV-2026-000001`). Line items calculated with Decimal-safe arithmetic.
6. **Invoice Issuance**: `DRAFT` → `ISSUED`. Reminders scheduled.
7. **Payment Recording & Allocation**: Payment recorded with provider reference. Allocated transactionally to invoice.
8. **Prompt 05 Financial Posting**: Successful payment invokes `postJournalTransaction()` on Prompt 05.
9. **Ledger Reconciliation**: Payment marked `RECONCILED` with timestamp and double-entry transaction link.

## 2. Invoice State Machine Transitions
Allowed Transitions:
- `DRAFT` → `ISSUED`, `VOID`, `CANCELLED`
- `ISSUED` → `PARTIALLY_PAID`, `PAID`, `OVERDUE`, `VOID`, `CANCELLED`
- `PARTIALLY_PAID` → `PAID`, `OVERDUE`, `CANCELLED`
- `PAID` → `VOID` (with reversal)
- `OVERDUE` → `PARTIALLY_PAID`, `PAID`, `VOID`
- `VOID` / `CANCELLED` (Terminal states)

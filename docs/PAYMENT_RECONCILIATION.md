# Payment Reconciliation Engine Architecture

## 1. Automated Reconciliation Flow
When a payment reaches status `SUCCEEDED`:
1. `processSuccessfulPaymentAndPostLedger()` resolves target Bank (`ASSET`) and Revenue (`REVENUE`) accounts in Prompt 05.
2. Invokes `postJournalTransaction()` passing `referenceNo: payment.paymentReference`.
3. Prompt 05 validates `SUM(DEBITS) === SUM(CREDITS)` and executes double-entry posting.
4. Prompt 11 updates `Payment.status` to `RECONCILED` with `reconciledAt` timestamp.

## 2. Payment Mismatch & Exception Handling
If payment amount or currency does not match Prompt 05 journal transaction:
1. Reconciliation engine raises a `Reconciliation Mismatch Exception`.
2. Records `RECONCILIATION_EXCEPTION_CREATED` event in AuditLog.
3. Places payment in Admin Reconciliation Workspace (`/billing/reconciliation`) for administrator review.
4. **Never** performs implicit auto-reconciliation or silent balance alterations.

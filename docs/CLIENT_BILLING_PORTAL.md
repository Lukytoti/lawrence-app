# Client Billing Portal Security Isolation

## 1. Access Control Strategy
Client access to `/client/billing` and `/client/billing/invoices/[invoiceId]` is strictly authorized by matching the authenticated client email against `DigitalClient.email`.

## 2. Zero Accounting Ledger Data Leakage
Client billing portal responses strictly exclude:
- Internal double-entry financial ledgers, journal entries, and accounts (Prompt 05).
- Internal payment reconciliation notes and accounting exceptions.
- Unrelated clients' invoices and contracts.
- Compensation calculations, rank structures, and member earnings.
- Internal staff notes and project margins.

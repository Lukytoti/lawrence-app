# Client Billing, Invoicing & Payment Collection Engine Architecture

## 1. Executive Summary & Non-Negotiable Source of Truth Rules
Module 11 (`src/modules/billing/`) is the **BILLING & PAYMENT COLLECTION AUTHORITY ONLY**.

- **Prompt 05/05.1 (Financial Ledger)**: Sole authority for financial accounts, double-entry transactions, and ledger balances. Prompt 11 **NEVER** mutates `FinancialAccount`, `JournalTransaction`, or `JournalEntry` directly. Confirmed billing payments trigger double-entry posting exclusively through Prompt 05's `postJournalTransaction()` service API.
- **Prompt 06 (CRM)**: Sole authority for leads, opportunities, pipelines, and CRM history. Contracts link to `CrmOpportunity` without altering CRM records.
- **Prompt 10 (Project & Service Delivery)**: Sole authority for digital projects, milestones, tasks, and deliverable reviews. Project contract values remain commercial metadata.

---

## 2. Component Structure (`src/modules/billing/`)
- `types.ts`: Billing DTOs, status enums, payment provider interfaces, calculation payloads.
- `profiles.ts`: BillingProfile CRUD, active profile resolution.
- `contracts.ts`: ClientContract lifecycle management, contract code generation (`CTR-2026-10001`).
- `schedules.ts`: Recurring billing schedule engine (`ONE_TIME`, `WEEKLY`, `MONTHLY`, `QUARTERLY`, `CUSTOM`) with period-reference idempotency protection.
- `invoices.ts`: Invoice creation, line items, Decimal calculations (`subtotal`, `taxAmount`, `discountAmount`, `totalAmount`, `amountPaid`, `amountDue`), state machine transitions, concurrency-safe invoice numbering (`INV-2026-000001`).
- `payments.ts`: Payment recording, provider transaction idempotency protection (`providerTransactionId`), payment allocation, status transitions (`PENDING` → `SUCCEEDED`).
- `providers.ts`: Payment provider abstraction layer (`PaymentProvider`, `ManualPaymentProvider`, `MockPaymentProvider`).
- `reconciliation.ts`: Reconciliation engine matching Billing Payment records with Prompt 05 double-entry journal transactions.
- `reminders.ts`: Deterministic invoice reminder engine (`UPCOMING`, `DUE_TODAY`, `OVERDUE`, `FINAL_NOTICE`).
- `permissions.ts`: Server-side RBAC guards for billing actions (14 system permissions).
- `service.ts`: Core billing orchestration service. Invokes Prompt 05's `postJournalTransaction()`.
- `actions.ts`: Server Actions with RBAC protection & AuditLog recording.

---

## 3. Database Schema Extensions
- `BillingProfile`: Client billing identity, tax ID, payment terms, currency.
- `ClientContract`: Commercial contracts (`contractCode`, `contractValue`, statuses: `DRAFT`, `PENDING_SIGNATURE`, `ACTIVE`, `PAUSED`, `COMPLETED`, `TERMINATED`, `CANCELLED`).
- `BillingSchedule`: Recurring billing schedules (`ONE_TIME`, `WEEKLY`, `MONTHLY`, `QUARTERLY`, `CUSTOM`).
- `Invoice`: Invoice header (`invoiceNumber`, `subtotal`, `taxAmount`, `discountAmount`, `totalAmount`, `amountPaid`, `amountDue`, statuses: `DRAFT`, `ISSUED`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`, `VOID`, `CANCELLED`).
- `InvoiceLineItem`: Itemized invoice lines with `Decimal(18,4)` precision.
- `Payment`: Payment lifecycle records (`paymentReference`, `providerTransactionId`, statuses: `PENDING`, `PROCESSING`, `SUCCEEDED`, `FAILED`, `CANCELLED`, `REFUNDED`, `RECONCILED`).
- `PaymentAllocation`: Transactional allocation of payments against invoices.
- `BillingReminder`: Invoice reminders (`UPCOMING`, `DUE_TODAY`, `OVERDUE`, `FINAL_NOTICE`).

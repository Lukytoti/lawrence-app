# Financial Security & Concurrency Specification

## 1. Overview
This document specifies the security, concurrency protection, and permission rules governing the financial operating system. The system treats the financial ledger as an authoritative, immutable system-of-record.

---

## 2. Concurrency & Race-Condition Safety Strategy

### PostgreSQL Row-Level Pessimistic Locking
To prevent double-spend vulnerability when simultaneous payout requests are submitted against a member's available balance:
1. Payout creation starts an isolated database transaction (`db.$transaction`).
2. A PostgreSQL pessimistic row-level lock is acquired on the financial account:
   ```sql
   SELECT id FROM "FinancialAccount" WHERE id = $1 FOR UPDATE;
   ```
3. While holding this exclusive lock, the service recalculates `Available Balance`:
   $$\text{Available Balance} = \text{Ledger Balance} - \text{Reserved Funds}$$
4. If requested amount exceeds `Available Balance`, the transaction aborts and throws `"Insufficient available funds"`.
5. If valid, the new `PENDING` `PaymentRequest` is created, immediately reserving the funds for subsequent concurrent transactions.

### Live PostgreSQL Test Proof
Verified via Vitest execution simulating simultaneous `Promise.all([createPaymentRequest(40000), createPaymentRequest(40000)])` against a 50,000 NGN balance. Exactly **one** request succeeds, and the second is safely rejected.

---

## 3. Financial Privacy & Server-Side Authorization

All financial server actions and services enforce server-side Role-Based Access Control (RBAC):
- `finance:read_own`: Required for members to view their own balances, ledger history, and request payouts.
- `finance:manage`: Required for administrators to approve/reject payouts, post adjustments, and resolve disputes.

### Data Scoping
Members can strictly query their own `memberId` records. Cross-member querying by non-admin users is blocked server-side.

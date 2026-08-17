# PROMPT 08 — Nigeria NeoLife Compensation Engine Architecture

## Architecture Overview

Module 08 (`src/modules/compensation`) is the **sole compensation calculation authority** within the Business Productivity & Leadership Operating System.

### Authority Boundaries & System Separation of Concerns

1. **Qualification Authority (Prompt 03A / 03B)**:
   - Evaluates member volumes (`QPV`, `PPV`, `PV`, `BV`), active status, qualified ranks (`DIRECTOR`, `EMERALD_DIRECTOR`, `RUBY_DIRECTOR`, etc.), QD legs, and Group PV.
   - Persists evaluation results in `MemberQualification`.
   - Sole authority for rank determination and qualification states.

2. **Compensation Calculation Authority (Prompt 08)**:
   - Consumes qualification state from `MemberQualification`.
   - Evaluates data-driven `CompensationRule` instances.
   - Computes itemized earnings, gross totals, and adjustments.
   - Manages compensation run state machine (`DRAFT` -> `CALCULATING` -> `CALCULATED`/`REVIEW_REQUIRED` -> `APPROVED` -> `POSTING` -> `POSTED`).
   - Persists self-contained immutable calculation snapshots in `MemberCompensationResult.snapshotJson` and `EarningLineItem`.

3. **Financial Ledger Authority (Prompt 05 / 05.1)**:
   - Double-entry accounting system (`FinancialAccount`, `JournalTransaction`, `JournalEntry`).
   - Sole wallet, balance calculation, and financial transaction ledger authority.
   - Calculates balances via append-only ledger entries (`SUM(DEBITS)` vs `SUM(CREDITS)`).
   - Zero secondary wallets, secondary balance tables, or direct balance mutations allowed.

---

## Domain Data Models

```mermaid
erDiagram
    PlanVersion ||--o{ CompensationRule : "defines"
    QualificationPeriod ||--o{ CompensationRun : "calculates for"
    PlanVersion ||--o{ CompensationRun : "uses"
    CompensationRun ||--o{ MemberCompensationResult : "contains"
    MemberCompensationResult ||--o{ EarningLineItem : "breakdown"
    MemberCompensationResult ||--o{ CompensationAdjustment : "adjustments"
    JournalTransaction ||--o? MemberCompensationResult : "posted transaction"
    JournalTransaction ||--o? CompensationAdjustment : "offsetting transaction"
```

---

## Double-Entry Ledger Posting Contract

When an approved `CompensationRun` is posted to the double-entry financial ledger:
- Reference Number Format: `COMP-{YEAR}-{MONTH}-{memberId}`
- Debit Entry: `COMPANY_EXPENSE_NETWORK_COMPENSATION` (Expense Account)
- Credit Entry: Member `MEMBER_PAYABLE` (Liability Account)
- Invariant Enforced: `SUM(DEBITS) === SUM(CREDITS)`
- Idempotency Enforced: `MemberCompensationResult.postedTransactionId` `@unique` index prevents duplicate postings.

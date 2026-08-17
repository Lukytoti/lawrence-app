# Double-Entry Ledger Architecture Specification

## 1. Accounting Invariant
Every posted financial transaction strictly enforces the double-entry balancing invariant:
$$\sum \text{DEBITS} = \sum \text{CREDITS}$$

If $\sum \text{DEBITS} \neq \sum \text{CREDITS}$, `postJournalTransaction` aborts and throws an exception.

---

## 2. Dynamic Derived Balances

Balances are never stored as overwriteable columns. All wallet metrics are derived from historical entries:
$$\text{Ledger Balance} = \sum_{\text{MEMBER\_PAYABLE}} (\text{CREDIT} - \text{DEBIT})$$
$$\text{Reserved Amount} = \sum_{\text{PENDING, APPROVED, PROCESSING}} \text{PaymentRequest.amount}$$
$$\text{Available Balance} = \max(0, \text{Ledger Balance} - \text{Reserved Amount})$$

---

## 3. Immutability & Offsetting Adjustments

Historical `POSTED` entries cannot be updated or deleted. Corrections are applied exclusively through offsetting transactions referencing `relatedEntryId` with a mandatory administrative reason.

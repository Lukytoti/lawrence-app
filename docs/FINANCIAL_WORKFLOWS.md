# Financial Workflows & Payment Request State Machine

## 1. Payment Request State Machine

```
      [ PENDING ]
        /   |   \
       /    |    \
      v     v     v
 [APPROVED] [REJECTED] [CANCELLED]
     |
     v
[PROCESSED] (Posts DEBIT withdrawal journal)
```

- `PENDING`: Funds reserved; available balance reduced.
- `APPROVED`: Admin approved payout request.
- `PROCESSED`: Withdrawal DEBIT journal committed.
- `REJECTED`: Request denied with mandatory reason; reserved funds released.
- `CANCELLED`: Member cancelled request; reserved funds released.

---

## 2. Multi-Currency & Domain Separation

- **Currencies**: `NGN` and `USD` accounts are completely isolated per member (`FinancialAccount` unique on `[memberId, currency]`). No implicit currency mixing or conversion occurs.
- **Domains**: Clear isolation across `NETWORK_MARKETING`, `DIGITAL_MARKETING`, and `OUTSOURCING`.

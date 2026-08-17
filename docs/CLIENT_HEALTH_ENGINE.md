# Deterministic Client Health Engine

## 1. Score Calculation & Explainable Factors
Client Health Engine evaluates 5 signal categories:
1. **Billing Overdue Analysis**: Overdue invoices subtract 15 points per invoice (up to -40 max).
2. **Project Delivery Health**: Blocked/on-hold projects subtract 25 points; past-due milestones subtract 10 points each (up to -20 max).
3. **Contract Expiration Proximity**: Active contract expiring within 14 days subtracts 20 points; expired active contract subtracts 30 points.
4. **Engagement Recency**: No touchpoint recorded within 30 days subtracts 15 points.
5. **Open Retention Cases**: Active retention cases subtract 15 points per case.

## 2. Health States
- `HEALTHY` (80–100)
- `STABLE` (65–79)
- `AT_RISK` (40–64)
- `CRITICAL` (1–39)
- `CHURNED` (0 or archived client)

## 3. Snapshot Immutability
All calculated health results are saved in `ClientHealthSnapshot` records. Historical records are immutable.

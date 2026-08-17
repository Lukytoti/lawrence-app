# Data-Driven Compensation Rules & Safety Invariants

## Data-Driven Rule Architecture

The compensation engine evaluates data-driven rules configured in `CompensationRule` for each active `PlanVersion`.

| Rule Code | Category | Verified Component | Monetary Base Formula | Safety Default Status |
|---|---|---|---|---|
| `SVB_RULES` | `SVB` | `SVBRateConfig` QPV Tier Resolution | Configured in `configurationJson` (`BV` / `QPV`) | `ACTIVE` |
| `LDB_RULES` | `LDB` | Unverified | `UNCONFIGURED` | `UNCONFIGURED` |
| `NDB_RULES` | `NDB` | Unverified | `UNCONFIGURED` | `UNCONFIGURED` |
| `RANK_BONUS_DIRECTOR` | `RANK_BONUS` | Unverified | `UNCONFIGURED` | `UNCONFIGURED` |

---

## Unconfigured Rule Safety Guarantee

If a `CompensationRule` status is `UNCONFIGURED` or lacks an explicit verified monetary calculation base:
1. `calculatedAmount` is strictly set to `0.0000 NGN`.
2. `eligibilityStatus` is set to `'UNCONFIGURED'`.
3. An administrator warning is logged in `errorSummaryJson`.
4. Zero financial ledger postings (`JournalTransaction` / `JournalEntry`) are generated for the unconfigured line.
5. Zero `EarningPosted` events are published.
6. The system never halts, crashes, or assumes default fallback formulas.

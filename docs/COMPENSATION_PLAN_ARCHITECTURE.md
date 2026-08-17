# Compensation Plan Architecture Documentation

## 1. Overview
The Compensation Plan Architecture models multi-country, versioned plan definitions for network marketing operations.

## 2. Model Structure
```
CompensationPlan (country="NG", name="NeoLife Nigeria Plan")
  └── PlanVersion (versionName="2026.1", status="ACTIVE", effectiveFrom=2026-01-01)
        ├── Rank (DISTRIBUTOR, MANAGER, SENIOR_MANAGER, EXEC_MANAGER, DIRECTOR, EMERALD_DIRECTOR)
        │     └── RankRequirement (QPV_THRESHOLD, PPV_THRESHOLD, CONSECUTIVE_MONTHS)
        └── SVBRateConfig (minQPV, maxQPV, ratePercent)
```

## 3. Version Status Lifecycle
- `DRAFT`: Plan version under administrative preparation.
- `ACTIVE`: Currently active plan version for evaluations.
- `ARCHIVED`: Historical plan version no longer used for new evaluations.

## 4. Operational Boundaries & Reserved Directives
- **No Hard-Coded Rules**: Business logic relies on data-driven requirements.
- **Future Earnings Engine Integration**: The Compensation Plan Architecture provides SVB rates and qualified volumes. Actual payouts, LDB, and NDB calculations are deferred to future modules.

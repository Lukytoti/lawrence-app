# Rank Engine Architecture Documentation

## 1. Overview
The Rank Engine establishes a data-driven, country-specific, plan-version-aware framework for tracking and evaluating network marketing leadership ranks.

## 2. Key Conceptual Principles
- **Data-Driven Rules**: Ranks, ordering, levels, and qualification requirements are defined in database configuration tables (`CompensationPlan`, `PlanVersion`, `Rank`, `RankRequirement`, `SVBRateConfig`), NOT hard-coded into JavaScript logic.
- **Achieved Rank vs Qualified Status**:
  - `Achieved Rank`: The highest title/rank a member has historically earned. Never destroyed or downgraded when a monthly qualification fails.
  - `Qualified Status`: Indicates whether a member meets the qualification rules during a specific period (`QUALIFIED` vs `NOT_QUALIFIED`).
- **QPV vs BV**:
  - `QPV` (Qualified Point Value): Qualification and SVB rate percentage threshold metric.
  - `BV` (Bonus Volume): Volume used for future monetary bonus calculations.

## 3. Configured Rank Ordering (Nigeria NeoLife Plan 2026.1)
| Level | Rank Code | Rank Name | Required QPV | Category |
| :--- | :--- | :--- | :--- | :--- |
| **0** | `DISTRIBUTOR` | Distributor | Base | `DISTRIBUTOR_FAMILY` |
| **1** | `MANAGER` | Manager | 500 QPV | `DISTRIBUTOR_FAMILY` |
| **2** | `SENIOR_MANAGER` | Senior Manager | 1,000 QPV | `DISTRIBUTOR_FAMILY` |
| **3** | `EXECUTIVE_MANAGER` | Executive Manager | 2,000 QPV | `DISTRIBUTOR_FAMILY` |
| **4** | `DIRECTOR` | Director | 4,000 QPV | `DIRECTOR_FAMILY` |
| **5** | `EMERALD_DIRECTOR` | Emerald Director | 4,000 QPV (3 consecutive months) | `DIRECTOR_FAMILY` |
| **6** | `SAPPHIRE_DIRECTOR` | Sapphire Director | Unverified Placeholder | `DIRECTOR_FAMILY` |
| **7** | `RUBY_DIRECTOR` | Ruby Director | Unverified Placeholder | `RUBY_FAMILY` |
| **8** | `TWO_RUBY_DIRECTOR` | 2 Ruby Director | Unverified Placeholder | `RUBY_FAMILY` |

## 4. Requirement Types & vocabulary
- `QPV_THRESHOLD`: Minimum Qualified Point Value per period.
- `PPV_THRESHOLD`: Minimum Personal Point Value per period.
- `CONSECUTIVE_MONTHS`: Consecutive qualifying months requirement (e.g. Emerald Director).
- `ACTIVE_STATUS`: Minimum monthly active status flag.

## 5. Domain Service Contracts (`src/modules/ranks/service.ts`)
- `getCurrentRank(memberId)`: Resolves active rank.
- `getHighestAchievedRank(memberId)`: Resolves highest achieved rank from `RankHistory`.
- `getCurrentQualification(memberId, periodId)`: Retrieves period qualification.
- `getNextRank(currentLevel, planVersionId)`: Resolves next target rank.
- `getRankProgress(memberId, periodId)`: Calculates structured progress payload.
- `evaluateMemberQualification(memberId, periodId, volumes)`: Data-driven evaluation engine.

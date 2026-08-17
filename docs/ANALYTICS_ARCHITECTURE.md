# Executive Intelligence, Analytics & Reporting Engine Architecture

## 1. Executive Summary & Non-Negotiable Source of Truth Rules
Module 09 (`src/modules/analytics`) is an **ANALYTICS & REPORTING AUTHORITY ONLY**. 
It consumes authoritative domain records from Prompts 01–08 and never introduces a secondary source of truth.

- **Qualification**: Reads Prompt 03A/03B (`MemberQualification`, `Rank`). Never recalculates qualification.
- **Financial Ledger**: Reads Prompt 05/05.1 (`FinancialAccount`, `JournalEntry`). Never creates or mutates balances.
- **CRM**: Reads Prompt 06 (`CrmLead`, `CrmOpportunity`). Never alters pipeline states.
- **Productivity**: Reads Prompt 04 (`ProductivityScore`, `Goal`, `ActivityInstance`).
- **Community**: Reads Prompt 07 (`CommunityPost`, `DirectMessage`, `LeadershipAttentionAlert`).
- **Compensation**: Reads Prompt 08 (`MemberCompensationResult`, `CompensationRun`).

---

## 2. Component Structure (`src/modules/analytics/`)
- `types.ts`: DTO contracts, scope types (`GLOBAL`, `TEAM`, `MEMBER`), KPI interface, anomaly signals.
- `metrics.ts`: Centralized KPI Registry enforcing metric metadata and permission requirements.
- `queries.ts`: High-performance PostgreSQL aggregations and recursive CTEs (`getDownlineMemberIdsCTE`).
- `trends.ts`: Metric trend engine (`calculateMetricTrend`) with zero-denominator safety.
- `reports.ts`: Executive report generators for all 10 intelligence domains.
- `exports.ts`: CSV export generator with RBAC scope filtering.
- `service.ts`: Executive Intelligence dashboard orchestrator & rule-based anomaly detector.
- `actions.ts`: Server Actions with server-side RBAC guards.
- `permissions.ts`: RBAC permission helper guards.

---

## 3. Database Schema Extensions
- `AnalyticsSnapshot`: Analytical snapshot cache table used for expensive aggregations without modifying authoritative tables.
- Linked to `QualificationPeriod` via `@relation(fields: [periodId], references: [id], onDelete: SetNull)`.

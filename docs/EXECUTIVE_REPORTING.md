# Executive Reporting Engine Documentation

## Overview
Module 09 provides 8 executive report types via `src/modules/analytics/reports.ts`:
1. `ORGANIZATION_PERFORMANCE_REPORT`: Member counts, active status, growth rate, direct downlines.
2. `RANK_PERFORMANCE_REPORT`: Rank distributions, newly achieved ranks, qualified Directors.
3. `QUALIFICATION_TREND_REPORT`: Qualification rates, QPV, PPV, BV volume totals.
4. `COMPENSATION_RUN_REPORT`: Calculated, approved, and posted compensation amounts.
5. `DOUBLE_ENTRY_FINANCIAL_REPORT`: Ledger balances, payment requests, approved payouts.
6. `CRM_PIPELINE_REPORT`: Leads by source/temperature, pipeline value, conversion rates.
7. `MEMBER_PRODUCTIVITY_REPORT`: Daily/weekly/monthly productivity averages and task completion.
8. `COMMUNITY_ENGAGEMENT_REPORT`: Post/comment/reaction counts, training progress, leadership alerts.

## Export Engine
CSV exports are generated via `generateCsvExport(reportType, actorUserId, memberIdsScope)` in `exports.ts`. Every export action is logged in `AuditLog` with `REPORT_EXPORTED` action type.

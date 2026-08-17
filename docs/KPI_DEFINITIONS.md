# Executive KPI Definitions Registry

Every metric displayed on executive dashboards is registered in `src/modules/analytics/metrics.ts`.

| Metric Key | Display Name | Unit | Period | Source Module | Permission Required |
|---|---|---|---|---|---|
| `total_members` | Total Members | COUNT | MONTHLY | Prompt 02/02.5 | `analytics:read_own` |
| `active_member_rate` | Active Member Rate | PERCENT | MONTHLY | Prompt 02/02.5 | `analytics:read_own` |
| `qualification_rate` | Qualification Rate | PERCENT | MONTHLY | Prompt 03A/03B | `analytics:read_own` |
| `total_qpv` | Total QPV | COUNT | MONTHLY | Prompt 03A/03B | `analytics:read_own` |
| `crm_pipeline_value` | CRM Pipeline Value | CURRENCY | MONTHLY | Prompt 06 | `crm:read_own` |
| `crm_conversion_rate` | CRM Conversion Rate | PERCENT | MONTHLY | Prompt 06 | `crm:read_own` |
| `productivity_score_avg` | Avg Productivity Score | SCORE | MONTHLY | Prompt 04 | `productivity:read` |
| `engagement_score_avg` | Avg Engagement Score | SCORE | MONTHLY | Prompt 07 | `community:read` |
| `total_compensation_posted` | Total Posted Compensation | CURRENCY | MONTHLY | Prompt 08 | `analytics:compensation` |
| `total_ledger_balance` | Double-Entry Ledger Balance | CURRENCY | MONTHLY | Prompt 05/05.1 | `analytics:financial` |

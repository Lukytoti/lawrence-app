# Compensation Security & Access Control

## Role-Based Access Control (RBAC) Matrix

| Permission Code | Description | SUPER_ADMIN | ADMIN | LEADER | TEAM_LEADER | MEMBER |
|---|---|:---:|:---:|:---:|:---:|:---:|
| `finance:compensation:read` | View compensation runs & rules | ✅ | ✅ | ✅ | ✅ | ❌ |
| `finance:compensation:calculate` | Initiate runs & previews | ✅ | ✅ | ❌ | ❌ | ❌ |
| `finance:compensation:approve` | Approve calculated runs | ✅ | ✅ | ❌ | ❌ | ❌ |
| `finance:compensation:post` | Post approved runs to double-entry ledger | ✅ | ✅ | ❌ | ❌ | ❌ |
| `finance:compensation:adjust` | Create offsetting adjustments | ✅ | ✅ | ❌ | ❌ | ❌ |
| `finance:compensation:rules:read` | Inspect data-driven rules | ✅ | ✅ | ✅ | ❌ | ❌ |
| `finance:compensation:rules:manage` | Manage rule configurations | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## Privacy & Financial Visibility Controls

- Members can ONLY access their own personal earnings breakdowns via `/finance/earnings` (`finance:read_own`).
- Executive administrators with `finance:compensation:read` access `/finance/compensation`.
- Direct database mutations, manual SQL balance overrides, or hardcoded user emails are strictly prohibited.
- Audit logs (`COMPENSATION_RUN_CREATED`, `COMPENSATION_APPROVED`, `COMPENSATION_POSTED`, `COMPENSATION_ADJUSTED`) are recorded for every state change.

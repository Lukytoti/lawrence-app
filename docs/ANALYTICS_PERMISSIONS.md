# Analytics Permissions & Security Matrix

## System Permissions
Module 09 introduces 7 system permissions registered in database seed:

- `analytics:read_own`: Inspect own member performance analytics.
- `analytics:read_team`: Inspect organizational downline scope via PostgreSQL recursive CTEs.
- `analytics:read_all`: Inspect global organization-wide executive analytics.
- `analytics:financial`: View double-entry ledger balance analytics.
- `analytics:compensation`: View compensation run & earnings analytics.
- `analytics:manage`: Administer analytics snapshot caches and settings.
- `analytics:export`: Export reports to CSV format.

## System Role Mapping
- **SUPER_ADMIN / ADMIN**: All 7 analytics permissions.
- **LEADER**: `analytics:read_own`, `analytics:read_team`, `analytics:export`.
- **TEAM_LEADER**: `analytics:read_own`, `analytics:read_team`, `analytics:export`.
- **MEMBER**: `analytics:read_own`.

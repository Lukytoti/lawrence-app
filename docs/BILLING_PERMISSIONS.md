# Billing Permissions & Security Matrix

## System Permissions
Module 11 registers 14 system permissions in database seed:

- `billing:read_own`: Inspect own client billing records.
- `billing:read_team`: Inspect team client billing records.
- `billing:read_all`: Inspect all organization billing records.
- `billing:create`: Create billing profiles, contracts, and invoices.
- `billing:update`: Update contracts and invoices.
- `billing:issue`: Issue draft invoices.
- `billing:cancel`: Cancel invoices and contracts.
- `billing:manage_contracts`: Manage client commercial contracts.
- `billing:manage_schedules`: Configure recurring billing schedules.
- `billing:record_payment`: Record client payments and allocations.
- `billing:reconcile`: Reconcile payments with Prompt 05 financial ledger.
- `billing:refund`: Process payment refunds.
- `billing:export`: Export billing and revenue reports.
- `billing:admin`: Full billing engine administration.

## Role Assignment Matrix
- **SUPER_ADMIN / ADMIN**: All 14 permissions.
- **LEADER / TEAM_LEADER**: `read_own`, `read_team`, `create`, `update`, `issue`, `manage_contracts`, `record_payment`.
- **MEMBER**: `read_own`.

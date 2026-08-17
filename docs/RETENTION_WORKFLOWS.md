# Retention Workflows & Case State Machine

## 1. Case State Machine
State transitions:
`OPEN` → `INVESTIGATING` → `ACTION_PLAN` → `MONITORING` → `RESOLVED` (or `CHURNED`).

## 2. Task Integration
When an action plan is defined on a retention case, the system automatically creates a Prompt 04 `Task` assigned to the owner's `NetworkMember` record.

## 3. AuditLog & EventBus
- `RETENTION_CASE_CREATED`
- `RETENTION_CASE_UPDATED`
- `RETENTION_CASE_RESOLVED`
- Events: `RetentionCaseCreated`, `RetentionCaseResolved`.

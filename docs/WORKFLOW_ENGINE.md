# Workflow Execution Engine & Idempotency Safeguards

## 1. Execution Flow
`executeWorkflow()` receives `idempotencyKey` and executes steps sequentially:
1. Validates `idempotencyKey` uniqueness.
2. Enforces database transaction (`$transaction`) and PostgreSQL row locking.
3. Evaluates `CONDITION` steps using `conditions.ts`.
4. Invokes domain service APIs for `TASK`, `CRM_ACTION`, `RETENTION_ACTION`, `NOTIFICATION`.
5. Logs execution steps in `AutomationExecutionLog`.

## 2. Idempotency Guarantee
Parallel event deliveries for the same key (e.g. `LeadCreated:leadId:2026-08-15`) execute strictly once; concurrent requests return the existing execution result safely.

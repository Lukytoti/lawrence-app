# Disaster Recovery Engine & Runbook Execution Protocol

## 1. Overview
The Disaster Recovery Engine (`src/modules/resilience/recovery.ts`) provides deterministic, ordered, idempotent, auditable, and resumable recovery runbook execution.

## 2. Core Execution Protocol
- **Sequential Step Progression**: Recovery steps are executed strictly in order of `stepNumber`.
- **Idempotency Guarantee**: Every `RecoveryExecution` is keyed by unique `executionCode` (`REC_${timestamp}_${uuid}`). Re-executing an active or completed plan is protected by transaction boundaries and status checks.
- **State Machine Integrity**:
  - `PENDING` -> `RUNNING` or `CANCELLED`
  - `RUNNING` -> `PAUSED`, `COMPLETED`, `FAILED`, `CANCELLED`
  - `PAUSED` -> `RUNNING` or `CANCELLED`
  - `FAILED` -> `ROLLBACK_REQUIRED`
  - `COMPLETED`, `CANCELLED`, `ROLLBACK_REQUIRED` are terminal states.
- **Rollback Safeguards**: Required step failures halt execution, emit `RecoveryFailed` events, and allow manual transition to `ROLLBACK_REQUIRED`.

## 3. Supported Step Types
- `VALIDATION`: Health check, replica lag check, DNS validation.
- `BACKUP`: Immediate point-in-time backup before failover.
- `RESTORE`: Database or configuration restoration from verified backup.
- `CONFIGURATION`: Environment variable or endpoint failover switch.
- `SERVICE_START` / `SERVICE_STOP`: Process lifecycle coordination.
- `HEALTH_CHECK`: Deep endpoint ping and connection validation.
- `DATA_VERIFICATION`: Row count and financial account balance sanity checks.
- `NOTIFICATION`: Operator broadcast via Prompt 14 event dispatcher.
- `MANUAL_APPROVAL`: Explicit operator gate before hazardous operations.

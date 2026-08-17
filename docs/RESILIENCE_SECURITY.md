# Platform Resilience Security, Authorization & Safeguards

## 1. Least-Privilege Role-Based Access Control (RBAC)
Module 20 defines 17 granular permission codes:
- `resilience:read_own`, `resilience:read_team`, `resilience:read_all`
- `resilience:create`, `resilience:update`
- `resilience:manage_backups`, `resilience:execute_backup`, `resilience:verify_backup`
- `resilience:manage_recovery`, `resilience:execute_recovery`
- `resilience:manage_continuity`, `resilience:manage_dependencies`
- `resilience:manage_drills`, `resilience:manage_incidents`
- `resilience:admin`, `resilience:export`, `resilience:audit`

---

## 2. Dangerous Operations Safeguards
Destructive and high-impact operations (`RESTORE_PRODUCTION`, `EXECUTE_RECOVERY`, `FAILOVER_PRODUCTION`, `ROLLBACK_PRODUCTION`, `DELETE_BACKUP`) require:
1. **Authentication**: Active server session.
2. **Server-Side Authorization**: `hasResiliencePermission(actorUserId, permissionCode)`.
3. **Explicit Confirmation**: Cryptographic or explicit action token matching `CONFIRM_RECOVERY_EXECUTION`.
4. **Audit Trail**: Immediate append-only event recorded in `RecoveryAuditLog`.
5. **Correlation ID**: Tracing identifier propagated across all side-effects.

---

## 3. Secret & Credential Redaction Protocol
The `sanitizeForAudit()` utility sanitizes metadata dictionaries and logs against:
- Passwords, API keys, access/refresh tokens.
- Client secrets, webhook secrets, authorization headers.
- Private keys, credit cards, CVVs.
Redacted fields are permanently replaced with `[REDACTED]`. Error messages are scrubbed via `sanitizeErrorMessage()`.

# GOVERNANCE SECURITY & SERVER-SIDE RBAC

## 1. Governance Permissions (12)
- `governance:read_own`: View governance overview.
- `governance:read_team`: View team governance dashboard.
- `governance:read_all`: View all platform governance records.
- `governance:manage_security`: Security operations & event management.
- `governance:manage_incidents`: Incident lifecycle management.
- `governance:manage_access_reviews`: Access review management.
- `governance:manage_compliance`: Compliance control & evidence management.
- `governance:manage_risks`: Security risk register management.
- `governance:manage_observability`: Telemetry & observability management.
- `governance:admin`: Platform governance super admin.
- `governance:export`: Export governance reports.
- `governance:audit`: Audit log integrity checks.

## 2. Server Action Guard Pattern
Every server action enforces:
1. User authentication.
2. Server-side permission check via `hasGovernancePermission(actorUserId, permCode)`.
3. Input validation.
4. Execution of domain logic.
5. Immutable audit logging via `logAuditEvent()`.
6. Output sanitization via `sanitizeGovernanceMetadata()`.

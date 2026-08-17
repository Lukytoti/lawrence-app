# Command Center Security & Audit Model — Module 17

## Authorization Principles
- **Zero Client-Side Security**: All permissions are evaluated server-side in Server Actions and API endpoints.
- **Strict Role-Based Access Control (RBAC)**:
  - Security checks read from database tables (`Role`, `Permission`, `UserRole`, `RolePermission`).
  - No hardcoded email or user name checks in security evaluation logic.
  - Oluwatobi is assigned `SUPER_ADMIN` via seed configuration.
- **Privacy & Scope Isolation**:
  - Regular members see only self-scoped metrics and public actions.
  - Executive KPIs and cross-domain lookups require `command_center:read` or `SUPER_ADMIN`.
  - Financial data access is read-only via Prompt 05 services.
- **Audit Trails**: Every quick action, workflow trigger, and search parameter execution is logged via `logAuditEvent`.

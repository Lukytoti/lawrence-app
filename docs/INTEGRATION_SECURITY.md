# Integration Security & Governance Policy

## 1. Security Mandates
1. **Server-Side RBAC**: All integration Server Actions and API endpoints evaluate permissions via `hasIntegrationPermission(userId, permissionCode)`.
2. **SSRF Guardrails**: Outbound API requests validate target hostnames against loopback, private RFC1918, link-local, and cloud metadata IP ranges.
3. **Secret Isolation**: Secrets are stored by reference and scrubbed from all logs, DB JSON fields, and AI prompt context.
4. **Audit Trail Integrity**: All management actions (`REGISTER_INTEGRATION`, `CREATE_INTEGRATION_CONNECTION`, `RETRY_DEAD_LETTER`, `DISCARD_DEAD_LETTER`) record immutable entries via `logAuditEvent`.
5. **Ledger Protection**: Financial ledger tables (`FinancialAccount`, `JournalTransaction`, `JournalEntry`) are untouched by Module 19.

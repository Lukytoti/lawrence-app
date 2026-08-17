# Automation Security & Sensitive Credential Isolation

## 1. Server-Side RBAC
12 system permissions (`automation:read_own`, `automation:read_team`, `automation:read_all`, `automation:create`, `automation:update`, `automation:activate`, `automation:pause`, `automation:execute`, `automation:manage_rules`, `automation:manage_schedules`, `automation:admin`, `automation:export`) enforced server-side on all Server Actions.

## 2. Credential Sanitization
Execution logs and metadata JSON fields NEVER store passwords, CVVs, API keys, card numbers, or secrets.

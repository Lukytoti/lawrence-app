# Digital Project Security & RBAC QA Audit

## 1. Server-Side RBAC Enforcement
All 13 system permissions (`projects:read_own`, `projects:read_team`, `projects:read_all`, `projects:create`, `projects:update`, `projects:assign`, `projects:manage_services`, `projects:manage_templates`, `projects:manage_milestones`, `projects:manage_deliverables`, `projects:approve`, `projects:client_portal`, `projects:admin`) are strictly enforced server-side via `permissions.ts` guards.

UI state is purely cosmetic; unprivileged direct Server Action calls are rejected with explicit permission errors.

## 2. Horizontal Privilege Escalation Protection
Users cannot mutate or view projects outside their permitted organization or team scope. Requests attempt to access another user's project or task without matching ownership/team scope are denied.

## 3. Financial Ledger Boundary Integrity
Project contract values and currency are stored as commercial metadata only. Operations on digital projects execute **zero balance mutations** and create **zero journal transactions** on Prompt 05/05.1 financial accounts.

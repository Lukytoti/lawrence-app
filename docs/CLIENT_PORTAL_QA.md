# Client Portal Security & Isolation QA Audit

## 1. Zero Financial & Internal Data Leakage
`getClientPortalProjectData()` filters response objects at the database query level to ensure:
- Internal notes (`visibility: "INTERNAL"`) are excluded.
- Double-entry financial ledgers, journal entries, and accounts are completely hidden.
- Unrelated client projects and internal staff tasks are omitted.

## 2. Access Authorization & Revocation Lifecycle
Client portal access requires an `ACTIVE` grant in `ClientPortalAccess` matching the client email and target `projectId`. Revoked or ungranted access attempts are rejected with an explicit `Unauthorized client access` error.

# Client Portal Security & Visibility Isolation Matrix

## 1. Access Control Strategy
Client access to `/client/projects/[projectId]` is explicitly granted via `ClientPortalAccess` records matching `projectId` and `email`.

## 2. Zero Internal Data Leakage
Client portal responses strictly exclude:
- Internal project activities (`visibility: "INTERNAL"`).
- Double-entry financial ledgers, journal entries, and payment accounts (Prompt 05).
- Staff-only internal notes and internal project tasks.
- Unrelated projects or other client records.
- Compensation calculations and rank structures (Prompt 08).

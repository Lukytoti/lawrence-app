# Deliverable Versioning & Client Review Engine

## 1. Version Preservation Invariant
When a deliverable requires revision:
1. Client or internal reviewer submits feedback (`REVISION_REQUESTED`).
2. Subsequent deliverable submission creates a new version (`v2`, `v3`).
3. Previous version records (`v1`) remain completely preserved in the database for auditing. Historical versions are never overwritten or deleted.

## 2. Review Lifecycle
- `DRAFT` → `SUBMITTED`
- `SUBMITTED` → `UNDER_REVIEW` (Client review requested)
- `UNDER_REVIEW` → `APPROVED` OR `REVISION_REQUIRED`
- Deliverables link to Prompt 04 `Evidence` records via `evidenceId`.

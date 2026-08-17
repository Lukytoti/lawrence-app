# Project Workflows & Conversion Engine

## 1. CRM Won Opportunity Conversion Flow
1. Commercial Opportunity reaches stage `WON` in Digital Marketing / Outsourcing domain.
2. `convertWonOpportunityToProject(crmOpportunityId)` is invoked.
3. Idempotency Check: Returns existing project if already converted.
4. Client Resolution: Reuses existing `DigitalClient` from Prompt 06 conversion authority.
5. Code Generation: Generates unique `PRJ-10001` code.
6. Project Created: Status initialized to `PLANNED`.
7. Template Application: If `templateId` provided, instantiates default milestones automatically.

## 2. Project State Machine Transitions
Allowed Transitions:
- `DRAFT` → `PLANNED`, `CANCELLED`
- `PLANNED` → `ACTIVE`, `CANCELLED`
- `ACTIVE` → `CLIENT_REVIEW`, `REVISION_REQUIRED`, `COMPLETED`, `CANCELLED`
- `CLIENT_REVIEW` → `ACTIVE`, `REVISION_REQUIRED`, `COMPLETED`, `CANCELLED`
- `REVISION_REQUIRED` → `ACTIVE`, `CLIENT_REVIEW`, `CANCELLED`
- `COMPLETED` → `ARCHIVED`

All invalid transitions are strictly rejected with an explicit error.

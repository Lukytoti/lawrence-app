# Digital Client, Project & Service Delivery Engine Architecture

## 1. Executive Summary & Non-Negotiable Source of Truth Rules
Module 10 (`src/modules/projects`) is the **PROJECT & SERVICE DELIVERY AUTHORITY ONLY**.

- **CRM**: Sole authority for leads, opportunities, pipelines, prospect interactions, and stage history (Prompt 06).
- **Financial Ledger**: Sole authority for financial accounts, ledger balances, journal transactions, payment requests, and withdrawals (Prompt 05/05.1). Zero secondary ledgers or project balances.
- **NeoLife Compensation**: Sole authority for compensation runs and rules (Prompt 08/08.1).
- **Productivity Scoring**: Sole authority for productivity scores, tasks, and goals (Prompt 04).
- **Community**: Sole authority for community engagement and training (Prompt 07).
- **Executive Intelligence**: Sole authority for analytics and reporting (Prompt 09/09.1).

---

## 2. Component Structure (`src/modules/projects/`)
- `types.ts`: Project, milestone, task, deliverable, review status enums and DTO contracts.
- `service-catalog.ts`: Service catalog CRUD and activation logic.
- `templates.ts`: Project template definition and template-to-project instantiation.
- `conversion.ts`: `convertWonOpportunityToProject()` implementation with transactional boundaries, row locking, and idempotency protection.
- `projects.ts`: Project CRUD, state machine transitions, health engine, progress calculation.
- `milestones.ts`: Milestone creation, sequence ordering, and status updates.
- `tasks.ts`: Project task management and integration with Prompt 04 `Task` model.
- `deliverables.ts`: Deliverable submission, versioning (preserving v1, v2 immutably), and Prompt 04 `Evidence` integration.
- `reviews.ts`: Client review workflow (`requestClientReview`, `submitClientReview`, `approveDeliverable`, `requestRevision`).
- `client-portal.ts`: Client portal authorization and client-visible data filtering.
- `permissions.ts`: Server-side RBAC guards for project actions.
- `actions.ts`: Server Actions with RBAC guards.

---

## 3. Database Schema Extensions
- `DigitalService`: Configurable service catalog records.
- `DigitalProject`: Primary digital project entity linked to `DigitalClient`, `CrmOpportunity`, and `User`.
- `DigitalMilestone`: Milestone sequence entity.
- `ProjectTask`: Project tasks optionally linked to Prompt 04 `Task`.
- `ProjectDeliverable`: Deliverable entity with version history, linked to Prompt 04 `Evidence`.
- `ClientReview`: Deliverable review feedback and approvals.
- `ProjectActivity`: Auditable activity timeline with `INTERNAL` vs `CLIENT_VISIBLE` scoping.
- `ClientPortalAccess`: Explicit client email access grants for project portal.
- `ProjectTemplate` & `ProjectTemplateMilestone`: Configurable project templates.

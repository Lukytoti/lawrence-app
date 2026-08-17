# Project Permissions & Security Matrix

## System Permissions
Module 10 introduces 13 system permissions registered in database seed:

- `projects:read_own`: Inspect own assigned projects.
- `projects:read_team`: Inspect team projects.
- `projects:read_all`: Inspect all organization projects.
- `projects:create`: Create digital projects.
- `projects:update`: Update project details and status transitions.
- `projects:assign`: Assign project managers and project tasks.
- `projects:manage_services`: Administer digital service catalog.
- `projects:manage_templates`: Administer project templates.
- `projects:manage_milestones`: Create and update milestones.
- `projects:manage_deliverables`: Submit and update deliverables.
- `projects:approve`: Approve client deliverable reviews.
- `projects:client_portal`: Grant and revoke client portal access.
- `projects:admin`: Full digital project engine administration.

## Role Assignment Matrix
- **SUPER_ADMIN / ADMIN**: All 13 permissions.
- **LEADER / TEAM_LEADER**: `read_own`, `read_team`, `create`, `update`, `assign`, `manage_milestones`, `manage_deliverables`, `approve`.
- **MEMBER**: `read_own`, `update` (for assigned tasks/deliverables).

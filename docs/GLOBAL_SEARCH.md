# Global Search & Cross-Domain Lookup Engine — Module 17

## Overview
The Global Search Engine provides unified multi-domain search across Network Members, CRM Leads & Prospects, Digital Clients, Projects, Billing Invoices, Tasks, and Community Threads.

## Security & Permission Scoping
- **Role-Aware Filtering**:
  - `MEMBER`: Restricted to self data and public community.
  - `LEADER`: Access downline network members and assigned projects.
  - `ADMIN` / `SUPER_ADMIN`: Cross-domain organization search.
- **Relevance Scoring**: Search results are scored dynamically by field match priority (e.g., Code > Exact Name > Substring > Email).
- **Saved Views**: Users can save search filter combinations using `UnifiedSavedView`.

# AGENTS.md — AI Agent Guidance & Development Protocol

## 1. Product Context & Vision
This application is a private **Business Productivity & Leadership Operating System** built for **Oluwatobi** (Owner/Super Admin) and his organization. It eventually supports two core areas:
1. **Network Marketing Business** (Organization trees, ranks, leadership, team reports, activities, books, training, community)
2. **Digital Marketing Business** (Clients, projects, outsourcing, compensation, financial requests, earnings)

## 2. Core Architecture Principles
- **Modular Domain Boundaries**: Domain modules live in `src/modules/<domain_name>`. Each module isolates its domain services, types, actions, and components.
- **Event-Driven Decoupling**: Modules communicate via application events (`EventBus`), notifications, and audit logs rather than raw cross-table SQL operations.
- **Strict Role-Based Access Control (RBAC)**: All security is database-backed (`Role`, `Permission`, `UserRole`, `RolePermission`). **NEVER** hardcode user emails, names, or `if (user == "Oluwatobi")` checks in security rules. Oluwatobi is assigned `SUPER_ADMIN` via seed/config.
- **Immutable Financial Ledger Architecture (Reserved Directive)**: Future financial balances are calculated from an append-only ledger (`LedgerEntry`). Balances must NEVER be directly updated via destructive edits. Adjustments are offsetting entries.
- **Effective-Dated Organization History (Reserved Directive)**: Future team trees maintain effective dates (`effectiveFrom`, `effectiveTo`). Member movement creates auditable history events.
- **Standardized Entity Metadata**: Persistent entities follow the metadata standard (`id`, `createdAt`, `updatedAt`, `archivedAt`, `deletedAt`, `createdBy`, `updatedBy`). Destructive SQL `DELETE` is prohibited for core financial, audit, and org data.

## 3. Design System & Aesthetics
- **Dark-First Modern Aesthetic**: Charcoal canvas (`#09090B`), dark slate surfaces (`#111113`, `#18181B`), subtle borders (`rgba(255,255,255,0.08)`), and **Deep Wine / Burgundy** brand accents (`#7F1D1D`, `#5B1111`, `#991B1B`).
- **Tailwind CSS + CSS Design Variables**: All colors, radii, shadows, and typography tokens are declared in `src/app/globals.css` and consumed via Tailwind classes.
- **Productivity Operating System UX**: High clarity, progressive disclosure, clean hierarchy, accessible `Cmd+K` command palette, and responsive mobile-first member experience.

## 4. Coding & Security Rules
- **Server-Side Authorization Required**: Frontend UI state is for UX only. All server components, API routes, and Server Actions MUST evaluate permissions (`hasPermission(userId, permissionCode)`) server-side.
- **Privacy Controls**: Financial and organizational visibility are strictly permission-scoped. Members can only access their own private financial data; Admins see org-scoped summaries based on permissions.
- **No Mock Production Data**: Seed data must be strictly isolated to development environments.

## 5. Instructions for Future AI Agents
Before modifying or extending this application:
1. **Read `AGENTS.md` and all documentation in `docs/`.**
2. **Inspect existing domain modules in `src/modules/` and shared services in `src/lib/`.**
3. **Preserve existing API contracts, database schemas, and migration history.**
4. **Never rewrite working modules unnecessarily.**
5. **Run `npm run test` and `npm run build` to verify changes before marking complete.**

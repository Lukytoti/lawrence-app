# Development Rules & Engineering Standards

## 1. Zero Destructive Changes
- Never drop database tables or modify production schema without Prisma migrations.
- Core audit, financial, and organizational data must never undergo raw SQL deletion (`DELETE FROM`). Use soft deletion (`deletedAt`, `archivedAt`) where applicable.

## 2. Security First
- Never rely on client-side state for authorization. Enforce server-side permission checks (`hasPermission`) on all API routes, server actions, and protected pages.
- Never hardcode usernames, emails, or credentials in source code. Use database-backed RBAC roles and environment variables.

## 3. Design System & Aesthetics
- All visual components MUST consume design tokens defined in `src/app/globals.css` via Tailwind CSS utilities.
- Maintain the dark-first executive theme with Deep Wine accents.
- Responsive mobile UX must be tested for all interfaces.

## 4. Architecture & Modularity
- Business logic MUST be kept separate from React UI components.
- Cross-module communication must use domain service interfaces or the application `EventBus`.
- Avoid premature implementation of business rules not specified in the current phase.

## 5. Verification Protocol
- All code changes must pass TypeScript compilation (`npm run build`) and test suites (`npm run test`).
- Always run the application locally and verify UI in the browser before declaring completion.

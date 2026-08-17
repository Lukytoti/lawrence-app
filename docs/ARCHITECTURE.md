# System Architecture Specification

## 1. Domain Boundaries

The application is structured into modular domain boundaries in `src/modules/`:

### A. Core Platform Foundation (`src/modules/core`)
- Identity, Authentication, RBAC (`User`, `Role`, `Permission`, `UserRole`, `RolePermission`).
- System Settings & Audit Logger (`AuditLog`, `SystemSetting`, `Notification`).
- Application Event Bus (`src/lib/events.ts`).

### B. Network & Organization (`src/modules/org`)
- **Network Member**: Dedicated identity representation (`NetworkMember`) separating business status, member codes, lifecycle dates (`joinedAt`, `activatedAt`, `exitedAt`, `archivedAt`) from personal profile data.
- **Effective-Dated Organization Hierarchy**: `OrganizationRelationship` mapping `memberId` to `sponsorId` with `effectiveFrom` and `effectiveTo`.
- **Recursive Derivation Algorithms**:
  - `getCurrentSponsor(memberId)`: Resolves active relationship where `effectiveTo = null`.
  - `getDirectDownlines(sponsorId)`: Fast indexed lookup for level 1 downlines.
  - `getUplineChain(memberId)`: Iterative upward resolution of ancestor chain.
  - `getTotalDownlineCount(memberId)`: Recursive downstream descendant calculation.
  - `validateMoveNotCycle(memberId, newSponsorId)`: $O(H)$ cycle detection preventing self-sponsorship and ancestor-under-descendant moves.
  - `moveMemberSponsor(...)`: Closes active link with `effectiveTo = now` and inserts new active link while emitting events and audit logs.

## 2. Event-Driven Decoupling
Domain modules interact via `EventBus` (`src/lib/events.ts`):
- `MemberCreated`
- `MemberUpdated`
- `MemberMoved`
- `MemberExited`
- `MemberArchived`
- `MemberRestored`
- `SponsorChanged`

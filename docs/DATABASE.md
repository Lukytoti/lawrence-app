# Database Schema Specification

## Datasource
- **Engine**: PostgreSQL (`provider = "postgresql"`)
- **ORM**: Prisma Client `v6.19.3`

## Models Summary

### Identity & Foundation
- `User`: Core authentication entity (`id`, `email`, `passwordHash`, `status`, metadata).
- `Profile`: Personal info (`firstName`, `lastName`, `displayName`, `avatarUrl`, `phone`, `bio`).
- `Role`: System roles (`SUPER_ADMIN`, `ADMIN`, `LEADER`, `TEAM_LEADER`, `MEMBER`, `DIGITAL_MARKETING_MEMBER`, `CLIENT`).
- `Permission`: 23 system & network permissions.
- `RolePermission` & `UserRole`: Join tables.
- `AuditLog`: System audit trail.
- `Notification`: In-app notification queue.
- `SystemSetting`: Configuration key-value store.

### Network & Organization Domain (Module 02)
- `NetworkMember`: Network marketing identity (`memberCode`, `userId`, `status` [PROSPECT, ACTIVE, INACTIVE, AT_RISK, EXITED, ARCHIVED], `joinedAt`, `activatedAt`, `exitedAt`, `exitReason`, `archivedAt`).
- `OrganizationRelationship`: Effective-dated hierarchy log (`memberId`, `sponsorId`, `relationshipType`, `effectiveFrom`, `effectiveTo`, `reason`, `createdBy`).
  - Indexed on `[memberId, effectiveTo]`, `[sponsorId, effectiveTo]`, `[effectiveFrom, effectiveTo]`.

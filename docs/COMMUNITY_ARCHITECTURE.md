# Community Architecture Specification

## Overview
The **Community, Communication & Leadership Engagement Engine** (`src/modules/community/`) provides a private, executive-grade collaboration platform for the organization.

## Domain Models
- `CommunityPost`: Core feed posts with types (`ANNOUNCEMENT`, `GENERAL`, `TRAINING`, `MOTIVATION`, `ACHIEVEMENT`, `POLL`, `QUESTION`, `RESOURCE`) and server-side visibility scopes (`PUBLIC_COMMUNITY`, `TEAM`, `LEADERS_ONLY`).
- `CommunityComment`: Threaded comment hierarchy supporting parent-child reply relationships and soft deletion.
- `CommunityReaction`: Polymorphic reaction system (`LIKE`, `LOVE`, `CELEBRATE`, `SUPPORT`, `PRAY`) enforcing strict FK invariants (`POST` -> `postId`, `COMMENT` -> `commentId`, `MESSAGE` -> `messageId`).
- `CommunityMention`: Parses `@MemberName` / `@UserEmail` mentions, records mention instances, and dispatches notifications.

## Organization Scope Mapping
`targetTeamScopeId` maps directly to a `NetworkMember.id` acting as team root. Visibility for `TEAM` posts is evaluated server-side by checking if the viewer's `NetworkMember.id` matches `targetTeamScopeId` or is present in the `OrganizationRelationship` recursive CTE downline tree (`getDownlineMemberIds`). Zero secondary organization tables or hierarchies are created.

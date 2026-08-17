# Community & Communication System Workflows

## 1. Post Creation & Downline Visibility Workflow
1. Author submits post content with visibility `TEAM` and `targetTeamScopeId`.
2. Post service saves `CommunityPost` record and logs `POST_CREATED` in `AuditLog`.
3. EventBus dispatches `CommunityPostCreated` event.
4. When downline members view feed, PostgreSQL recursive CTE checks viewer membership in `targetTeamScopeId` downline tree.

## 2. Team Training Scope Assignment Workflow
1. Leader selects training module and scope `TEAM` with `teamRootMemberId`.
2. Service executes `getDownlineMemberIds(teamRootMemberId)` via recursive CTE.
3. Service materializes individual `TrainingAssignment` records for `[teamRootMemberId, ...downlineMemberIds]`.
4. Service creates `TrainingProgress` linked via `assignmentId`.
5. EventBus dispatches `TrainingAssigned` for each member.

## 3. Direct Message & Read Receipt Workflow
1. Member opens or creates conversation with another participant.
2. Sender posts message; `DirectMessage` is stored in PostgreSQL.
3. AuditLog logs `MESSAGE_SENT` metadata without message body text for privacy.
4. Recipient fetches messages via polling/SWR and triggers `markConversationAsRead`.
5. `MessageReadReceipt` record is created/updated with timestamp.

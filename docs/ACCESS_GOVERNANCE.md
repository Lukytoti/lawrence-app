# ACCESS GOVERNANCE & RBAC REVIEW

## 1. Access Review Lifecycle
Access Reviews evaluate effective user permissions derived from database RBAC tables (`UserRole`, `Role`, `RolePermission`, `Permission`).

### States
- `PENDING`: Review initialized, items populated.
- `IN_REVIEW`: Items currently being audited by reviewer.
- `APPROVED`: Access confirmed and signed off.
- `REVOKED`: Excess permissions identified; triggers `AccessRevoked` event.
- `CANCELLED`: Review cancelled without state change.

## 2. Principle of Least Privilege Enforcement
Reviewers evaluate each permission item (`RETAIN`, `REVOKE`, `ESCALATE`) with required audit notes.
Server Actions enforce `hasGovernancePermission(actorUserId, 'governance:manage_access_reviews')`.

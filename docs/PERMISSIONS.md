# Security Permissions Specification

## Permissions Registry (23 Active Permissions)

### System & Administration
- `users:read`: View user accounts.
- `users:write`: Create & manage users.
- `roles:manage`: Manage roles & permission assignments.
- `audit:read`: View audit log events.
- `settings:read`: View system settings.
- `settings:write`: Update system settings.

### Network & Organization
- `org:read`: View organization structure.
- `org:manage`: Administer organization nodes.
- `network:members:read`: View network members and profiles.
- `network:members:create`: Create network members.
- `network:members:update`: Edit network member details.
- `network:members:move`: Transfer member sponsor relationships.
- `network:members:archive`: Mark members as exited or archived.
- `network:members:restore`: Restore archived/exited members.
- `network:organization:read`: Access interactive visual tree.
- `network:organization:manage`: Administer effective-dated relationships.

### Productivity (Reserved)
- `tasks:read`, `tasks:manage`, `reports:read`, `reports:manage`

### Finance (Reserved)
- `finance:read_own`, `finance:read_all`, `finance:manage`

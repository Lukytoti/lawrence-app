# Community & Communication RBAC Permissions Matrix

## Permission Definitions
- `community:read`: Read public community posts, comments, and reactions.
- `community:post`: Publish new community posts.
- `community:comment`: Add comments and replies to posts.
- `community:messages`: Send and receive direct and group private messages.
- `community:training:read`: Access assigned training modules and submit progress.
- `community:training:create`: Create new training modules.
- `community:training:assign`: Assign training modules to members or team scopes.
- `community:training:review`: Review member training progress and evidence.
- `community:analytics:read`: View leadership engagement scores and attention signals.
- `community:moderate`: Moderate, pin, or archive community posts and comments.
- `community:announcements:create`: Create organization-wide announcement posts.
- `community:manage`: Full community administration.

## Role Assignment Matrix
- `SUPER_ADMIN` / `ADMIN`: All 12 permissions.
- `LEADER`: Read, post, comment, messages, training (read, create, assign, review), analytics read, announcements create, moderate.
- `TEAM_LEADER`: Read, post, comment, messages, training (read, assign), analytics read.
- `MEMBER`: Read, post, comment, messages, training read.

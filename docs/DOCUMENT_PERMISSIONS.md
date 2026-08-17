# Document RBAC, ACL & Permission Specification (Module 21)

## 1. Document Permissions Reference Table

| Permission Code | Module | Description |
| :--- | :--- | :--- |
| `documents:read_own` | `documents` | Read own documents and public knowledge |
| `documents:read_team` | `documents` | Read team documents and shared folders |
| `documents:read_all` | `documents` | Read all documents across organization |
| `documents:create` | `documents` | Create and draft new documents |
| `documents:update` | `documents` | Update document metadata and attributes |
| `documents:delete` | `documents` | Delete non-held documents |
| `documents:upload` | `documents` | Upload document files and new versions |
| `documents:download` | `documents` | Download authorized document files |
| `documents:share` | `documents` | Generate document share tokens |
| `documents:approve` | `documents` | Review and approve document releases |
| `documents:manage_folders` | `documents` | Create and organize document folders |
| `documents:manage_permissions` | `documents` | Manage ACL permissions on documents |
| `documents:manage_knowledge` | `documents` | Manage knowledge articles and collections |
| `documents:publish_knowledge` | `documents` | Publish authoritative knowledge entries |
| `documents:manage_retention` | `documents` | Configure document retention policies |
| `documents:manage_legal_hold` | `documents` | Place and release legal preservation holds |
| `documents:admin` | `documents` | Full document and knowledge system administration |
| `documents:export` | `documents` | Export document manifests and knowledge collections |
| `documents:audit` | `documents` | Access document activity audit logs |

## 2. Document Access Control List (ACL) Engine
Beyond role permissions, specific documents can define granular ACLs via `DocumentPermission`:
- `subjectType`: `USER`, `ROLE`, `ORGANIZATION`, `PUBLIC`.
- `permission`: `VIEW`, `DOWNLOAD`, `EDIT`, `SHARE`, `APPROVE`, `DELETE`, `ADMIN`.
- Time-bounded expiration support via `expiresAt`.

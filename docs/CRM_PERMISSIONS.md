# CRM Security & RBAC Matrix — Module 06

## 1. CRM Permission Definitions

| Permission Code | Module | Description |
| :--- | :--- | :--- |
| `crm:read_own` | `crm` | View assigned CRM prospects and follow-ups |
| `crm:read_team` | `crm` | View team CRM prospects and pipelines |
| `crm:read_all` | `crm` | View all organization prospects and pipeline metrics |
| `crm:create` | `crm` | Create new CRM prospects and opportunities |
| `crm:update` | `crm` | Update prospect details and pipeline stages |
| `crm:delete` | `crm` | Archive or delete CRM prospects |
| `crm:assign` | `crm` | Reassign prospect ownership |
| `crm:manage_pipelines` | `crm` | Administer CRM pipelines and stage rules |
| `crm:manage_tags` | `crm` | Manage prospect tag taxonomy |
| `crm:manage_sources` | `crm` | Manage lead source options |
| `crm:manage_scoring` | `crm` | Manage lead scoring rules |
| `crm:import` | `crm` | Import prospect records via CSV |
| `crm:export` | `crm` | Export prospect records |
| `crm:convert` | `crm` | Convert prospects to NetworkMembers or Digital Clients |
| `crm:manage_followups` | `crm` | Schedule and manage follow-ups |
| `crm:manage_appointments` | `crm` | Schedule and manage appointments |

## 2. Role Assignment Matrix

| Permission Code | SUPER_ADMIN | ADMIN | LEADER | TEAM_LEADER | MEMBER |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `crm:read_own` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `crm:read_team` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `crm:read_all` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `crm:create` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `crm:update` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `crm:delete` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `crm:assign` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `crm:convert` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `crm:manage_pipelines` | ✅ | ✅ | ❌ | ❌ | ❌ |

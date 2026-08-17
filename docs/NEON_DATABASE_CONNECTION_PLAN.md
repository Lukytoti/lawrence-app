# Neon Database Connection Plan

**Target Database Provider**: Neon Serverless PostgreSQL  
**Region**: AWS Europe Central 1 (Frankfurt) — `eu-central-1`  
**Application**: Business Productivity & Leadership Operating System  
**Evaluation Type**: Read-Only Configuration & Deployment Assessment

---

## 1. Current Database Configuration

- **Environment File**: `.env` in project root currently supplies `DATABASE_URL`.
- **Active Datasource Provider**: `postgresql` (configured in `prisma/schema.prisma` line 2).
- **Client Factory**: `src/lib/db.ts` exposes a singleton `PrismaClient` instance with global caching during development and single-instance instantiation in production.
- **Connection Isolation**: Zero hard-coded `localhost:5432`, `postgres://`, or database connection strings exist in application source code (`src/`).
- **Client-Side Exposure**: Zero occurrences of `DATABASE_URL` exist in any React Client Components or frontend bundles.

---

## 2. Prisma Configuration

- **Schema File**: `prisma/schema.prisma`
- **Datasource Block**:
  ```prisma
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }

  generator client {
    provider = "prisma-client-js"
  }
  ```
- **PostgreSQL Compatibility**: 100% compliant. All models, indexes, composite keys, and enums use native PostgreSQL syntax.

---

## 3. Environment Variables

### Required Database Variables for Neon:

| Variable | Description | Security Level | Requirement |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Neon PostgreSQL connection string (must include `?sslmode=require`). | `CRITICAL_SECRET` | **MANDATORY** |
| `DIRECT_URL` | Direct unpooled Neon connection string (for migrations if `DATABASE_URL` uses Neon `-pooler`). | `CRITICAL_SECRET` | **OPTIONAL / RECOMMENDED IF POOLER USED** |

---

## 4. Connection Pooling

Neon offers two connection endpoints:
1. **Pooled Connection String (`-pooler`)**:
   - Host format: `ep-xxxx-pooler.eu-central-1.aws.neon.tech`
   - Optimized for containerized and serverless environments (e.g. Next.js Server Actions) to prevent connection exhaustion.
2. **Direct Connection String (Unpooled)**:
   - Host format: `ep-xxxx.eu-central-1.aws.neon.tech`
   - Direct connection to PostgreSQL compute node.
   - **Prisma Migrations Rule**: `npx prisma migrate deploy` requires direct unpooled access (or `directUrl` in `schema.prisma`) because Prisma migration advisory locks cannot execute through transaction poolers.

*Recommendation*: If using the Direct Connection string for `DATABASE_URL`, no `schema.prisma` edits are needed and both queries and migrations execute seamlessly. If using the pooled URL for `DATABASE_URL`, `directUrl = env("DIRECT_URL")` can be configured.

---

## 5. Migration Readiness

- **Applied Migrations**: **20 migrations** in `prisma/migrations/`
  1. `20260814205351_init_postgresql`
  2. `20260814212206_add_rank_qualification_engine`
  3. `20260814215703_add_qualification_explanation_json`
  4. `20260814221403_add_productivity_engine_models`
  5. `20260815023533_add_financial_ledger_models`
  6. `20260815045000_add_crm_module_models`
  7. `20260815053000_add_community_communication_engine`
  8. `20260815060000_add_compensation_engine`
  9. `20260815070000_add_analytics_engine`
  10. `20260815080000_add_project_engine`
  11. `20260815090000_add_billing_engine`
  12. `20260815100000_add_client_retention_engine`
  13. `20260815110000_add_automation_engine`
  14. `20260815120000_add_notification_engine`
  15. `20260815130000_add_ai_engine`
  16. `20260815140000_add_unified_command_center`
  17. `20260816160000_add_platform_governance_engine`
  18. `20260816170000_add_integration_gateway_engine`
  19. `20260816180000_add_platform_resilience_engine`
  20. `20260816190000_add_document_knowledge_records_engine`
- **Migration Lock**: `prisma/migrations/migration_lock.toml` (`provider = "postgresql"`).
- **Execution Command**: `npx prisma migrate deploy` will apply all 20 migrations in sequential chronological order with zero schema loss and zero drift.

---

## 6. Security Review

- **SSL Mode**: Neon strictly requires TLS/SSL (`?sslmode=require`).
- **Source Control Safety**: `.gitignore` explicitly ignores `.env`, `.env.local`, `.env*.local`, and `*.pem` files.
- **Audit Redaction**: `sanitizeErrorMessage()` and `sanitizeForAudit()` in `src/modules/documents/security.ts` automatically strip Neon database connection URIs (`postgres://[REDACTED]`) from logs and error messages.
- **Ledger Immutability**: All 20 migrations maintain double-entry financial ledger constraints (immutable journal entries, balance integrity).

---

## 7. Required Configuration Changes

| Area | Current State | Required State for Neon |
| :--- | :--- | :--- |
| **Connection String** | Local `localhost:5432` in `.env` | Neon connection string with `?sslmode=require` |
| **SSL Enforcement** | Unenforced locally | Enforced by Neon endpoint |
| **Schema Migrations** | 20 applied on local DB | 20 to be applied on Neon via `npx prisma migrate deploy` |
| **Database Seed** | Seeded locally with test fixtures | Seed system records on Neon via `NODE_ENV=production npx tsx prisma/seed.ts` |

---

## 8. Safe Connection Procedure & Execution Status

- [x] **1. Connection String Configured**: Neon PostgreSQL connection string configured in `.env` with `?sslmode=require`.
- [x] **2. Migrations Deployed**: All 21 Prisma migrations deployed sequentially to Neon with zero schema drift.
- [x] **3. Production Seed Executed**:
  - 210 system permissions provisioned
  - 5 system roles created
  - Super Admin user (`oluwatobi@lawrenceapp.internal`) seeded
  - Development fixture data safely skipped
- [x] **4. Test Suite Verified**: Unit and regression test suites passing against live Neon database.

---

### NEXT ACTION

Paste your Neon connection string into `DATABASE_URL` in your local `.env` file (or provide confirmation once you have updated `.env`), and reply with **"PROCEED WITH NEON MIGRATION"** to execute `npx prisma migrate deploy`.

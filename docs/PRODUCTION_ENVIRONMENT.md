# Production Environment Contract

## 1. Executive Summary
This document defines the formal environment variable contract for the **Business Productivity & Leadership Operating System**. It categorizes all environment configuration keys across core infrastructure, security, notifications, integrations, document storage, and resilience.

---

## 2. Environment Variables Specification

### 2.1 Core Infrastructure & Authentication

| Variable Name | Purpose | Required / Optional | Consuming Module | Security Class | Startup Fail If Missing | Safe Dev Fallback |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | **REQUIRED** | Platform Core (`src/lib/db.ts`) | `CRITICAL_SECRET` | **YES** | Local PostgreSQL instance |
| `NEXTAUTH_URL` | Canonical base URL for NextAuth & OAuth redirects | **REQUIRED** | Platform Auth (`src/lib/auth.ts`) | `INTERNAL_CONFIG` | **YES** | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | 32+ character entropy string for JWT signing | **REQUIRED** | Platform Auth (`src/lib/auth.ts`) | `CRITICAL_SECRET` | **YES** | Development static fallback |
| `NODE_ENV` | Runtime environment (`production` / `development` / `test`) | **REQUIRED** | Platform Core | `INTERNAL_CONFIG` | **NO** | Defaults to `development` |
| `INITIAL_ADMIN_EMAIL` | Super Admin bootstrap email | Optional (Seed) | Database Seed (`prisma/seed.ts`) | `SENSITIVE` | **NO** | `oluwatobi@lawrenceapp.internal` |
| `INITIAL_ADMIN_PASSWORD` | Super Admin initial password | Optional (Seed) | Database Seed (`prisma/seed.ts`) | `CRITICAL_SECRET` | **NO** | `AdminPassword123!` |

---

### 2.2 Multi-Channel Notifications (Module 14)

| Variable Name | Purpose | Required / Optional | Consuming Module | Security Class | Startup Fail If Missing | Safe Dev Fallback |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID for SMS dispatch | Optional (Prod SMS) | Notifications (`src/modules/notifications/`) | `SENSITIVE` | **NO** (Fails closed in prod if SMS requested) | Sandbox mock logging |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token for API requests | Optional (Prod SMS) | Notifications (`src/modules/notifications/`) | `CRITICAL_SECRET` | **NO** | Sandbox mock logging |
| `TWILIO_PHONE_NUMBER` | E.164 Sender Phone Number | Optional (Prod SMS) | Notifications (`src/modules/notifications/`) | `SENSITIVE` | **NO** | Sandbox mock logging |
| `SENDGRID_API_KEY` | SendGrid / Resend API Key for Email dispatch | Optional (Prod Email) | Notifications (`src/modules/notifications/`) | `CRITICAL_SECRET` | **NO** (Fails closed in prod if Email requested) | Sandbox mock logging |
| `SMTP_HOST` | SMTP server host | Optional (Prod Email) | Notifications (`src/modules/notifications/`) | `INTERNAL_CONFIG` | **NO** | Sandbox mock logging |
| `SMTP_PORT` | SMTP server port | Optional (Prod Email) | Notifications (`src/modules/notifications/`) | `INTERNAL_CONFIG` | **NO** | `587` |
| `SMTP_USER` | SMTP username | Optional (Prod Email) | Notifications (`src/modules/notifications/`) | `SENSITIVE` | **NO** | Sandbox mock logging |
| `SMTP_PASS` | SMTP password | Optional (Prod Email) | Notifications (`src/modules/notifications/`) | `CRITICAL_SECRET` | **NO** | Sandbox mock logging |
| `EMAIL_FROM_ADDRESS` | Canonical sender email address | Optional (Prod Email) | Notifications (`src/modules/notifications/`) | `INTERNAL_CONFIG` | **NO** | `no-reply@lawrenceapp.internal` |
| `FCM_SERVER_KEY` | Firebase Cloud Messaging Server Key | Optional (Push) | Notifications (`src/modules/notifications/`) | `CRITICAL_SECRET` | **NO** | Sandbox mock logging |

---

### 2.3 External Integrations & API Gateway (Module 19)

| Variable Name | Purpose | Required / Optional | Consuming Module | Security Class | Startup Fail If Missing | Safe Dev Fallback |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `INTEGRATION_WEBHOOK_SECRET` | Default HMAC signing secret for inbound webhooks | Optional (Prod Webhooks) | Integrations (`src/modules/integrations/`) | `CRITICAL_SECRET` | **NO** (Fails closed if secret missing) | Static development key |
| `INTEGRATION_OUTBOUND_SECRET` | Secret key for signing outbound webhooks | Optional (Prod Webhooks) | Integrations (`src/modules/integrations/`) | `CRITICAL_SECRET` | **NO** | Static development key |
| `GOHIGHLEVEL_CLIENT_ID` | GoHighLevel OAuth App Client ID | Optional (GHL Sync) | Integrations (`src/modules/integrations/`) | `SENSITIVE` | **NO** | Mock provider |
| `GOHIGHLEVEL_CLIENT_SECRET` | GoHighLevel OAuth App Client Secret | Optional (GHL Sync) | Integrations (`src/modules/integrations/`) | `CRITICAL_SECRET` | **NO** | Mock provider |
| `STRIPE_SECRET_KEY` | Stripe Secret API Key for payment reconciliation | Optional (Payments) | Integrations / Billing | `CRITICAL_SECRET` | **NO** | Mock provider |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Endpoint Secret | Optional (Payments) | Integrations / Billing | `CRITICAL_SECRET` | **NO** | Mock provider |

---

### 2.4 Document & Knowledge Storage (Module 21)

| Variable Name | Purpose | Required / Optional | Consuming Module | Security Class | Startup Fail If Missing | Safe Dev Fallback |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `DOCUMENT_STORAGE_DRIVER` | Storage driver (`local` or `s3`) | Optional | Documents (`src/modules/documents/`) | `INTERNAL_CONFIG` | **NO** | Defaults to `local` |
| `DOCUMENT_STORAGE_BUCKET` | AWS S3 Bucket Name | Optional (if driver=s3) | Documents (`src/modules/documents/`) | `INTERNAL_CONFIG` | **NO** | `lawrence-documents-vault` |
| `DOCUMENT_STORAGE_REGION` | AWS S3 Region | Optional (if driver=s3) | Documents (`src/modules/documents/`) | `INTERNAL_CONFIG` | **NO** | `eu-west-1` |
| `AWS_ACCESS_KEY_ID` | AWS IAM Access Key ID | Optional (if driver=s3) | Documents (`src/modules/documents/`) | `SENSITIVE` | **NO** | Instance IAM Profile / Local |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM Secret Access Key | Optional (if driver=s3) | Documents (`src/modules/documents/`) | `CRITICAL_SECRET` | **NO** | Instance IAM Profile / Local |
| `DOCUMENT_STORAGE_LOCAL_PATH`| Root directory for local storage | Optional (if driver=local)| Documents (`src/modules/documents/`) | `INTERNAL_CONFIG` | **NO** | `storage/documents` |

---

### 2.5 Platform Resilience & Disaster Recovery (Module 20)

| Variable Name | Purpose | Required / Optional | Consuming Module | Security Class | Startup Fail If Missing | Safe Dev Fallback |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `BACKUP_STORAGE_BUCKET` | S3 bucket for PostgreSQL WAL and base backups | Optional (Infrastructure) | Resilience (`src/modules/resilience/`) | `INTERNAL_CONFIG` | **NO** | Logical storage reference |
| `DISASTER_RECOVERY_REGION` | Secondary AWS region for multi-region failover | Optional (Infrastructure) | Resilience (`src/modules/resilience/`) | `INTERNAL_CONFIG` | **NO** | `eu-central-1` |
| `ALERT_WEBHOOK_URL` | Webhook URL for P1/P2 operational resilience alerts | Optional | Resilience / Governance | `SENSITIVE` | **NO** | Internal event bus |

---

## 3. Secret Classification & Security Rules

1. **`CRITICAL_SECRET`**:
   - Must NEVER be committed to source control (`.gitignore` enforcement).
   - Must NEVER be rendered in client bundles (`process.env.NEXT_PUBLIC_*` strictly prohibited for secrets).
   - Must NEVER appear in audit logs, error stack traces, EventBus payloads, or AI prompt contexts.
2. **`SENSITIVE`**:
   - Identifiers that should not be publicly scraped (e.g. Account SIDs, sender emails).
3. **`INTERNAL_CONFIG`**:
   - Non-sensitive operational toggles and region identifiers.

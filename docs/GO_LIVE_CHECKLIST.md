# Enterprise Go-Live & Production Deployment Checklist

## 1. Infrastructure Provisioning & Configuration

- [ ] **Production Database Cluster**:
  - [ ] Primary PostgreSQL 16+ instance provisioned with High Availability (Multi-AZ).
  - [ ] Connection pooler (PgBouncer / RDS Proxy) configured with max connection limits.
  - [ ] SSL connection enforced (`sslmode=require`).
  - [ ] Database credentials stored in AWS Secrets Manager / Vault.
- [ ] **Continuous Backup & Recovery**:
  - [ ] Point-in-time recovery (PITR) enabled with 15-minute continuous WAL archiving.
  - [ ] Daily physical base snapshot automated at off-peak hours (02:00 UTC).
  - [ ] Snapshot copy replicated to secondary disaster recovery region (`eu-central-1`).
  - [ ] Restore procedure tested against isolated sandbox database.
- [ ] **Cloud Object Storage (AWS S3)**:
  - [ ] Production S3 bucket provisioned (`DOCUMENT_STORAGE_BUCKET`).
  - [ ] Server-Side Encryption enabled with AWS KMS Customer Managed Keys.
  - [ ] S3 Block Public Access 100% enabled on bucket and account levels.
  - [ ] IAM Role assigned to compute instances with least-privilege bucket policy.
- [ ] **Compute & Hosting Runtime**:
  - [ ] Node.js 20+ runtime deployed across minimum 2 containerized instances behind load balancer.
  - [ ] Production domain DNS configured with TLS 1.3 / HTTPS certificates.
  - [ ] Next.js production build (`npm run build`) verified with Exit Code 0.

---

## 2. Security, Secrets & Access Control

- [ ] **Secret Configuration**:
  - [ ] `NEXTAUTH_SECRET` generated with 256-bit cryptographically secure entropy.
  - [ ] `NEXTAUTH_URL` set to canonical production HTTPS domain.
  - [ ] Live third-party provider API keys populated in environment (`SENDGRID_API_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`).
  - [ ] Inbound webhook HMAC signing secrets configured (`INTEGRATION_WEBHOOK_SECRET`).
- [ ] **Role-Based Access Control (RBAC)**:
  - [ ] Super Admin credentials provisioned securely.
  - [ ] Initial Super Admin password changed from bootstrap default.
  - [ ] 210 system permissions verified across all 5 standard roles.
  - [ ] Multi-tenancy downline scoping verified server-side on all privileged Server Actions.
- [ ] **Network Perimeter Security**:
  - [ ] SSRF defense engine verified blocking private subnets and cloud metadata endpoints.
  - [ ] Web Application Firewall (WAF) rate limiting enabled on `/api/auth/` and `/api/webhooks/`.
  - [ ] CORS headers restricted strictly to production origin.

---

## 3. Operations, Observability & Health

- [ ] **Health Probes**:
  - [ ] `/api/health/readiness` returning HTTP 200 with all checks green.
  - [ ] `/command-center/health` monitored by synthetic health check agent.
- [ ] **Logging & Alerting**:
  - [ ] Centralized log shipping configured (CloudWatch / Datadog / Grafana Loki).
  - [ ] P1 / P2 resilience alerts hooked to Slack / PagerDuty webhook (`ALERT_WEBHOOK_URL`).
  - [ ] Security incident triggers verified emitting `PlatformSecurityEvent`.

---

## 4. Application Verification Sign-Off

- [ ] **Prisma Migrations**: All 20 migrations deployed cleanly (`npx prisma migrate status`).
- [ ] **Test Suite**: All 30 unit & integration test suites passing (922+ tests, 100%).
- [ ] **Financial Ledger**: Zero direct mutations on `FinancialAccount`, `JournalTransaction`, or `JournalEntry` verified.
- [ ] **Legal Preservation Holds**: Retention evaluator verified respecting active preservation locks.
- [ ] **Architecture Certification**: Final architect sign-off recorded in `docs/PRODUCTION_READINESS.md`.

# Module 19 — Secure Integration & Connectivity Engine Architecture

## 1. Executive Summary & Purpose
Module 19 establishes the enterprise-grade integration authority for the Business Productivity & Leadership Operating System.
It governs external API connectivity, credential reference isolation, inbound/outbound webhook routing, field mapping transformations, exponential backoff retries, and dead-letter queue (DLQ) operations.

## 2. Core Architecture Principles
1. **Integration Authority Only**: Module 19 answers "HOW DOES THE SYSTEM CONNECT TO EXTERNAL SYSTEMS?". It does NOT define business truth.
2. **Financial Ledger Isolation**: Module 19 MUST NEVER directly mutate `FinancialAccount`, `JournalTransaction`, or `JournalEntry` tables. All financial events delegate to Prompt 05/05.1 services.
3. **Reference-Based Credential Isolation**: API keys, OAuth tokens, and secrets are stored in a server-side secret store. Only masked reference tokens (`cred_ref_...`) appear in database JSON fields, logs, AI prompts, or UI components.
4. **SSRF Protection Engine**: All HTTP requests are validated against strict SSRF blocklists prohibiting `localhost`, `127.0.0.1`, `0.0.0.0`, IPv6 loopbacks (`::1`), RFC1918 private ranges, and cloud metadata endpoints (`169.254.169.254`).
5. **Database-Level Idempotency**: Webhook deliveries require unique `idempotencyKey` values backed by Prisma `@unique` constraints. Duplicate deliveries yield `isDuplicate: true` with zero duplicate execution.

## 3. Data Model Architecture
- `Integration`: Master registry of external system adapters and providers.
- `IntegrationConnection`: Environment connection settings (`DEVELOPMENT`, `STAGING`, `PRODUCTION`) with credential reference tokens.
- `IntegrationEndpoint`: Inbound/outbound REST endpoint specifications with timeouts and retry policies.
- `IntegrationWebhook`: Inbound webhook listener configurations with HMAC secret references.
- `IntegrationEvent`: Event ledger recording inbound/outbound event execution, idempotency keys, and payload hashes.
- `IntegrationJob`: Scheduled async synchronization tasks with attempt counters and exponential backoff retry schedules.
- `IntegrationMapping`: Source-to-target entity field transformation rules.
- `IntegrationLog`: Sanitized execution logs with correlation IDs and execution latencies.
- `IntegrationHealth`: Connection health telemetry recording latency, error rate, and availability status.

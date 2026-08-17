# SECURITY OPERATIONS & EVENT LOGGING

## 1. Security Event Normalization
Every security event is processed through `recordSecurityEvent` in `src/modules/governance/security-events.ts`.
Each record includes:
- Unique `eventCode` (`SECEVT-2026-...`)
- `correlationId` (auto-assigned if missing)
- Categorized `eventType`, `severity`, `source`, `actorId`, `action`, `result`

## 2. Sensitive Data Sanitization
All metadata and text payloads are recursively scrubbed by `sanitizeGovernanceMetadata()`.
Redaction rules:
- Keys matching: `/password/`, `/secret/`, `/token/`, `/apikey/`, `/authorization/`, `/bearer/`, `/cvv/`, `/creditcard/`, `/privatekey/`
- Pattern values: Credit card regex (`\b(?:\d[ -]*?){13,16}\b`), Bearer token strings

## 3. Rate Limiting & Secret Exposure Monitoring
- `recordRateLimitEvent()` logs threshold exceedances.
- Failed authentication spikes trigger `AUTH_BURST` security events and automatically escalate to incident creation when >= 10 attempts occur in 15 minutes.

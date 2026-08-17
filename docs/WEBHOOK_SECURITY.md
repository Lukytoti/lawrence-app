# Webhook Gateway & Security Architecture

## 1. Overview
The Webhook Gateway processes inbound webhooks from external providers and dispatches outbound webhooks to third-party endpoints.

## 2. Inbound Webhook Security Protocol
1. **HMAC Signature Verification**: Validates `X-Webhook-Signature` using HMAC SHA-256 in constant time (`crypto.timingSafeEqual`).
2. **Payload Hashing**: Calculates SHA-256 hash of `rawBody` payload for integrity verification.
3. **Database-Level Idempotency**: Evaluates `idempotencyKey` against `@unique` database constraint. If an event has already been registered, duplicate processing is halted immediately (`isDuplicate: true`).
4. **Domain Event Routing**: Routes validated payloads to authoritative domain services (`createLead`, `postJournalTransaction`, etc.) without direct SQL table mutations.

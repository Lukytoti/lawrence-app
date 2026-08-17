# Messaging Architecture Specification

## Overview
The Private Messaging Engine handles 1-on-1 direct conversations and group discussions using PostgreSQL persistence with client-side SWR/polling revalidation ($3-5$s interval).

## Architectural Principles
1. **Server-Side Authorization**: Only active `ConversationParticipant` members can read, send, or query messages.
2. **AuditLog Privacy Guard**: Audit log records action metadata (`MESSAGE_SENT`, `CONVERSATION_CREATED`) without storing sensitive message body text.
3. **Read Receipts**: Persisted in `MessageReadReceipt` with `readerId` and `readAt` timestamps.
4. **Evidence Attachments**: Integrates with Prompt 04 `Evidence` store (`evidenceId`).

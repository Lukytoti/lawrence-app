# Module 14: Unified Notification, Communications & Multi-Channel Messaging Engine Architecture

## 1. Architectural Overview
Module 14 is the authoritative messaging and notifications infrastructure layer for the application.
It decouples event triggering from message dispatching across 5 primary channels:
- **EMAIL**: Transactional & summary emails.
- **SMS**: High-urgency mobile alerts.
- **WHATSAPP**: Direct WhatsApp messaging via Cloud API.
- **IN_APP**: Persistent in-app user notifications.
- **WEBHOOK**: Signed HTTP payload delivery for external systems.

## 2. Non-Negotiable Domain Boundaries
- **Prompt 05/05.1 Ledger Authority**: Module 14 has **ZERO** direct table mutations on `FinancialAccount`, `JournalTransaction`, or `JournalEntry`.
- **Prompt 07 Community Authority**: Module 14 multi-channel messaging does NOT duplicate or replace community feed posts or direct user messaging tables.
- **Prompt 13 Automation Authority**: Workflow automation triggers module 14 message dispatching cleanly via `dispatchNotification()`.

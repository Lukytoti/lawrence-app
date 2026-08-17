# CRM Architecture Specification — Module 06

## 1. Architectural Overview
The CRM Engine isolates prospect management, outreach activity, commercial opportunity tracking, and lead conversion into `src/modules/crm/`.

## 2. Standard Data Models (11 CRM Models + 1 Minimum Foundation Model)
- **`CrmLead`**: Core prospect entity containing contact info, normalized phone (`+234...`), normalized email, score, temperature, status, and conversion links.
- **`CrmPipeline`**: Domain-specific pipeline container (`NETWORK_MARKETING`, `DIGITAL_MARKETING`).
- **`CrmStage`**: Ordered stages with win probability and brand color codes.
- **`CrmStageHistory`**: Auditable record of stage transitions.
- **`CrmOpportunity`**: Registered commercial deals (pipeline value only; financial balance mutations execute via Prompt 05 double-entry financial ledger).
- **`CrmInteraction`**: Communication records (calls, cold DMs, WhatsApp, emails).
- **`CrmFollowUp`**: Actionable reminders linked to tasks.
- **`CrmAppointment`**: Presentation and discovery meetings.
- **`CrmNote`**: Private and shared notes.
- **`CrmTag`**: Tag taxonomy.
- **`CrmLeadTag`**: Junction table for lead tags.
- **`DigitalClient`**: Minimum foundation model representing converted digital marketing clients (`CLT-10001`).

## 3. Explainable Lead Scoring Engine
Lead score ($0 - 100$) is computed dynamically from weighted rules:
- **Contact Completeness**: $+10$ pts (both email and phone).
- **Source Attribution**: $+15$ pts for referrals.
- **Outreach Responsiveness**: $+20$ pts for inbound/completed responses.
- **Appointments Booked**: $+25$ pts for scheduled or completed presentations.
- **High-Value Opportunities**: $+30$ pts for registered commercial deals.

**Temperature Scale**:
- **`COLD`**: $0 - 29$ pts
- **`WARM`**: $30 - 69$ pts
- **`HOT`**: $70+$ pts

## 4. Atomic & Idempotent Lead Conversion
- Lead conversion executes inside PostgreSQL `db.$transaction` using pessimistic row locking (`SELECT * FROM "CrmLead" WHERE id = ${leadId} FOR UPDATE;`).
- If `convertedMemberId` or `convertedClientId` is already populated, returns existing result immediately without re-creating `User`, `NetworkMember`, or `DigitalClient`.
- Source history, interactions, notes, and opportunities remain intact on `CrmLead`.

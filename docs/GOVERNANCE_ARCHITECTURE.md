# GOVERNANCE ARCHITECTURE & CROSS-CUTTING OVERVIEW

## 1. Domain Boundary & Purpose
Module 18 (**Platform Security, Governance, Observability & Compliance Engine**) is a cross-cutting platform authority residing in `src/modules/governance/`.

It does NOT create, alter, or duplicate business logic from Prompts 01–17. Rather, it serves as the platform-wide governance, compliance, incident-management, risk, and telemetry control authority.

## 2. Established Authority Isolation
- **Financial Ledger Isolation**: Zero direct mutations on `FinancialAccount`, `JournalTransaction`, `JournalEntry`. Prompt 05/05.1 remains the sole financial authority.
- **Member & Org Isolation**: Prompt 02/02.5 remains the sole member/org authority.
- **Qualification Isolation**: Prompt 03A/03B remains the sole rank/qualification authority.

## 3. Core Subsystems
1. **Security Operations**: Platform security events (`PlatformSecurityEvent`), correlation tracking, metadata scrubbing.
2. **Incident Management**: Incident state machine (`OPEN` → `ACKNOWLEDGED` → `INVESTIGATING` → `CONTAINED` → `RESOLVED` → `CLOSED`).
3. **Access Governance**: Periodic RBAC permission review (`AccessReview`, `AccessReviewItem`).
4. **Compliance Control Engine**: Compliance framework registry (`SOC2`, `ISO27001`, `GDPR`, `INTERNAL`), evidence tracking (`ComplianceEvidence`), scoring.
5. **Security Risk Register**: Matrix calculation (`riskScore = likelihood × impact`), mitigation workflows.
6. **System Observability & Anomaly Engine**: Health metrics across 14 components, automated threat detection.

# COMPLIANCE CONTROL REGISTRY & EVIDENCE TRACKING

## 1. Supported Frameworks
- **SOC2**: Security, Availability, Processing Integrity, Confidentiality, Privacy.
- **ISO27001**: Information Security Management System controls.
- **GDPR**: Data Privacy, Consent, Erasure, Data Export controls.
- **INTERNAL**: Enterprise operating system governance policies.

## 2. Evidence Collection & Evaluation
- Evidence items (`ComplianceEvidence`) link to controls with explicit expiration dates (`expiresAt`).
- `evaluateComplianceControl()` marks controls `AT_RISK` if required evidence is missing or expired, emitting `ComplianceControlAtRisk` on EventBus.
- `calculateComplianceScore()` computes overall percentage score `(activeControls / totalControls) * 100`.

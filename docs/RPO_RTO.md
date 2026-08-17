# Recovery Point & Time Objectives (RPO/RTO) Compliance Engine

## 1. Definitions & Mathematical Basis

### Recovery Point Objective (RPO)
$$RPO = \Delta t = t_{\text{now}} - t_{\text{last\_verified\_backup}}$$
The maximum acceptable data loss window measured in minutes from the last completed and verified backup.

### Recovery Time Objective (RTO)
$$RTO = t_{\text{recovery\_completion}} - t_{\text{recovery\_start}}$$
The maximum acceptable recovery duration measured in minutes from incident declaration to system restoration.

---

## 2. Compliance Evaluation Rules
- **RPO Compliance**: Compliant if $RPO \le \text{targetRpoMinutes}$. An unverified backup or missing backup yields $RPO = \infty$, triggering an immediate `RpoViolationDetected` event.
- **RTO Compliance**: Compliant if $RTO \le \text{targetRtoMinutes}$. If no completed recovery exists, $RTO = \infty$, triggering an `RtoViolationDetected` event.

---

## 3. Criticality Tiering Standards
| Tier | Criticality | Target RPO | Target RTO | Scope |
|---|---|---|---|---|
| **Tier 1** | `CRITICAL` | 15 mins | 30 mins | Core Database, Ledger, Auth |
| **Tier 2** | `HIGH` | 60 mins | 120 mins | CRM, Projects, Billing Gateway |
| **Tier 3** | `MEDIUM` | 240 mins | 480 mins | Community Feed, Analytics Snapshots |
| **Tier 4** | `LOW` | 1440 mins | 2880 mins | Static Assets, AI Cache |

# Platform Resilience Operations & Day-2 Management Guide

## 1. Daily Operations Checklist
1. **Backup Health Review**: Confirm all automated backup plans executed and verified (`/resilience/backups`).
2. **RPO/RTO Compliance Inspection**: Check objective compliance indicators (`/resilience`).
3. **Incident Triage**: Review any open resilience incidents and acknowledge within 15 minutes (`/resilience/incidents`).
4. **Dependency Map Inspection**: Confirm no circular dependencies or degraded dependencies (`/resilience/dependencies`).

---

## 2. Monthly Recovery Drill Protocol
- Execute scheduled recovery exercises (`/resilience/drills`) across all Tier-1 and Tier-2 recovery plans.
- Validate RTO duration and document lessons learned in drill execution notes.
- Drills run in isolated simulation mode without modifying production business records.

---

## 3. Disaster Recovery Execution Procedure
1. Navigate to `/resilience/recovery`.
2. Select target recovery plan and review step sequence.
3. Click "Execute Recovery".
4. Enter mandatory confirmation token `CONFIRM_RECOVERY_EXECUTION`.
5. Monitor real-time step execution progression on `/resilience/recovery/executions`.
6. Verify recovery completion and audit trail on `/resilience/audit`.

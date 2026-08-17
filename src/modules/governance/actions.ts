'use server';

import { hasGovernancePermission, GOVERNANCE_PERMISSIONS } from './permissions';
import { getGovernanceOverview, getSecurityOverview, getComplianceOverview } from './service';
import { createSecurityIncident, transitionSecurityIncident } from './incidents';
import { createAccessReview, completeAccessReview } from './access-reviews';
import { createComplianceControl, recordComplianceEvidence } from './compliance';
import { createSecurityRisk, transitionSecurityRisk } from './risks';
import { getServiceTelemetry } from './observability';
import { sanitizeGovernanceMetadata } from './security-events';
import { logAuditEvent } from '@/lib/audit';

export async function getGovernanceOverviewAction(actorUserId: string) {
  const allowed = await hasGovernancePermission(actorUserId, GOVERNANCE_PERMISSIONS.READ_OWN);
  if (!allowed) throw new Error('Unauthorized governance access');
  const res = await getGovernanceOverview(actorUserId);
  return sanitizeGovernanceMetadata(res);
}

export async function getSecurityOverviewAction(actorUserId: string) {
  const allowed = await hasGovernancePermission(actorUserId, GOVERNANCE_PERMISSIONS.MANAGE_SECURITY);
  if (!allowed) throw new Error('Unauthorized security operations access');
  const res = await getSecurityOverview();
  return sanitizeGovernanceMetadata(res);
}

export async function createSecurityIncidentAction(input: any, actorUserId: string) {
  const allowed = await hasGovernancePermission(actorUserId, GOVERNANCE_PERMISSIONS.MANAGE_INCIDENTS);
  if (!allowed) throw new Error('Unauthorized incident management access');
  const incident = await createSecurityIncident(input, actorUserId);
  await logAuditEvent({
    actorId: actorUserId,
    action: 'CREATE_SECURITY_INCIDENT',
    entityType: 'SecurityIncident',
    entityId: incident.id,
    metadata: { incidentCode: incident.incidentCode },
  });
  return sanitizeGovernanceMetadata(incident);
}

export async function transitionSecurityIncidentAction(
  incidentId: string,
  targetStatus: any,
  notes: any,
  actorUserId: string
) {
  const allowed = await hasGovernancePermission(actorUserId, GOVERNANCE_PERMISSIONS.MANAGE_INCIDENTS);
  if (!allowed) throw new Error('Unauthorized incident management access');
  const updated = await transitionSecurityIncident(incidentId, targetStatus, actorUserId, notes);
  await logAuditEvent({
    actorId: actorUserId,
    action: `TRANSITION_SECURITY_INCIDENT_${targetStatus}`,
    entityType: 'SecurityIncident',
    entityId: incidentId,
    metadata: { targetStatus },
  });
  return sanitizeGovernanceMetadata(updated);
}

export async function createAccessReviewAction(input: any, actorUserId: string) {
  const allowed = await hasGovernancePermission(actorUserId, GOVERNANCE_PERMISSIONS.MANAGE_ACCESS_REVIEWS);
  if (!allowed) throw new Error('Unauthorized access review management access');
  const review = await createAccessReview({ ...input, reviewerId: actorUserId });
  await logAuditEvent({
    actorId: actorUserId,
    action: 'CREATE_ACCESS_REVIEW',
    entityType: 'AccessReview',
    entityId: review.id,
    metadata: { targetUserId: input.userId },
  });
  return sanitizeGovernanceMetadata(review);
}

export async function createComplianceControlAction(input: any, actorUserId: string) {
  const allowed = await hasGovernancePermission(actorUserId, GOVERNANCE_PERMISSIONS.MANAGE_COMPLIANCE);
  if (!allowed) throw new Error('Unauthorized compliance management access');
  const control = await createComplianceControl(input, actorUserId);
  await logAuditEvent({
    actorId: actorUserId,
    action: 'CREATE_COMPLIANCE_CONTROL',
    entityType: 'ComplianceControl',
    entityId: control.id,
    metadata: { controlCode: control.controlCode },
  });
  return sanitizeGovernanceMetadata(control);
}

export async function createSecurityRiskAction(input: any, actorUserId: string) {
  const allowed = await hasGovernancePermission(actorUserId, GOVERNANCE_PERMISSIONS.MANAGE_RISKS);
  if (!allowed) throw new Error('Unauthorized risk management access');
  const risk = await createSecurityRisk(input, actorUserId);
  await logAuditEvent({
    actorId: actorUserId,
    action: 'CREATE_SECURITY_RISK',
    entityType: 'SecurityRisk',
    entityId: risk.id,
    metadata: { riskCode: risk.riskCode, riskScore: risk.riskScore },
  });
  return sanitizeGovernanceMetadata(risk);
}

export async function getObservabilityOverviewAction(actorUserId: string, serviceName?: string) {
  const allowed = await hasGovernancePermission(actorUserId, GOVERNANCE_PERMISSIONS.MANAGE_OBSERVABILITY);
  if (!allowed) throw new Error('Unauthorized observability access');
  const res = await getServiceTelemetry(serviceName);
  return sanitizeGovernanceMetadata(res);
}

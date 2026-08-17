import { db } from '@/lib/db';
import { CreateSecurityIncidentInput, SecurityIncidentStatus } from './types';
import { recordSecurityEvent } from './security-events';
import { eventBus } from '@/lib/events';
import crypto from 'crypto';

const ALLOWED_INCIDENT_TRANSITIONS: Record<SecurityIncidentStatus, SecurityIncidentStatus[]> = {
  OPEN: ['ACKNOWLEDGED', 'INVESTIGATING', 'CONTAINED', 'RESOLVED', 'CLOSED'],
  ACKNOWLEDGED: ['INVESTIGATING', 'CONTAINED', 'RESOLVED', 'CLOSED'],
  INVESTIGATING: ['CONTAINED', 'RESOLVED', 'CLOSED'],
  CONTAINED: ['RESOLVED', 'CLOSED'],
  RESOLVED: ['CLOSED', 'INVESTIGATING'],
  CLOSED: [],
};

export async function createSecurityIncident(
  input: CreateSecurityIncidentInput,
  actorUserId?: string
) {
  const count = await db.securityIncident.count();
  const incidentCode = `SECINC-2026-${(100001 + count).toString().padStart(6, '0')}-${crypto.randomBytes(2).toString('hex')}`;

  const incident = await db.securityIncident.create({
    data: {
      incidentCode,
      title: input.title,
      description: input.description,
      severity: input.severity,
      status: 'OPEN',
      category: input.category,
      assignedToId: input.assignedToId,
      rootCause: input.rootCause,
      metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });

  await recordSecurityEvent({
    eventType: 'SYSTEM_ALERT',
    severity: input.severity,
    source: 'INCIDENT_ENGINE',
    actorId: actorUserId,
    resourceType: 'SecurityIncident',
    resourceId: incident.id,
    action: 'CREATE_INCIDENT',
    result: 'SUCCESS',
    metadata: { incidentCode, title: input.title },
  });

  eventBus.publish('SecurityIncidentCreated', {
    incidentId: incident.id,
    incidentCode: incident.incidentCode,
    title: incident.title,
    severity: incident.severity,
  });

  return incident;
}

export async function transitionSecurityIncident(
  incidentId: string,
  targetStatus: SecurityIncidentStatus,
  actorUserId: string,
  notes?: { rootCause?: string; resolution?: string; metadata?: Record<string, any> }
) {
  const incident = await db.securityIncident.findUnique({ where: { id: incidentId } });
  if (!incident) throw new Error(`Security Incident not found: ${incidentId}`);

  const currentStatus = incident.status as SecurityIncidentStatus;
  const allowed = ALLOWED_INCIDENT_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(targetStatus)) {
    throw new Error(`Invalid incident status transition: ${currentStatus} -> ${targetStatus}`);
  }

  const updateData: any = {
    status: targetStatus,
  };

  if (targetStatus === 'ACKNOWLEDGED' && !incident.acknowledgedAt) {
    updateData.acknowledgedAt = new Date();
  }
  if ((targetStatus === 'RESOLVED' || targetStatus === 'CLOSED') && !incident.resolvedAt) {
    updateData.resolvedAt = new Date();
  }
  if (notes?.rootCause) updateData.rootCause = notes.rootCause;
  if (notes?.resolution) updateData.resolution = notes.resolution;

  const updated = await db.securityIncident.update({
    where: { id: incidentId },
    data: updateData,
  });

  await recordSecurityEvent({
    eventType: 'SYSTEM_ALERT',
    severity: updated.severity as any,
    source: 'INCIDENT_ENGINE',
    actorId: actorUserId,
    resourceType: 'SecurityIncident',
    resourceId: updated.id,
    action: `TRANSITION_${targetStatus}`,
    result: 'SUCCESS',
    metadata: { fromStatus: currentStatus, toStatus: targetStatus, ...notes },
  });

  if (targetStatus === 'RESOLVED' || targetStatus === 'CLOSED') {
    eventBus.publish('SecurityIncidentResolved', {
      incidentId: updated.id,
      incidentCode: updated.incidentCode,
      status: targetStatus,
    });
  }

  return updated;
}

import { db } from '@/lib/db';
import { eventBus } from '@/lib/events';
import { CreateResilienceIncidentInput, IncidentStatus, IncidentSeverity } from './types';
import { generateCorrelationId, generateEventCode, sanitizeForAudit } from './security';

const VALID_INCIDENT_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  OPEN: ['ACKNOWLEDGED', 'ASSESSING', 'CLOSED'],
  ACKNOWLEDGED: ['ASSESSING', 'RECOVERING', 'CLOSED'],
  ASSESSING: ['RECOVERING', 'MONITORING', 'RESOLVED', 'CLOSED'],
  RECOVERING: ['MONITORING', 'RESOLVED', 'ASSESSING'],
  MONITORING: ['RESOLVED', 'RECOVERING', 'OPEN'],
  RESOLVED: ['CLOSED', 'RECOVERING', 'OPEN'],
  CLOSED: [],
};

function isValidIncidentTransition(current: IncidentStatus, target: IncidentStatus): boolean {
  return VALID_INCIDENT_TRANSITIONS[current]?.includes(target) ?? false;
}

/**
 * Create a new resilience incident.
 */
export async function createResilienceIncident(input: CreateResilienceIncidentInput) {
  const correlationId = input.correlationId || generateCorrelationId();

  const incident = await db.resilienceIncident.create({
    data: {
      incidentCode: input.incidentCode,
      name: input.name,
      description: input.description,
      severity: input.severity,
      source: input.source,
      status: 'OPEN',
      correlationId,
    },
  });

  await db.recoveryAuditLog.create({
    data: {
      eventCode: generateEventCode('INCIDENT_CREATED'),
      incidentId: incident.id,
      eventType: 'RESILIENCE_INCIDENT_CREATED',
      message: `Resilience incident ${incident.incidentCode} opened with severity ${incident.severity}`,
      correlationId,
      metadataJson: JSON.stringify(sanitizeForAudit({ incidentCode: incident.incidentCode, severity: incident.severity })),
    },
  });

  await eventBus.publish('ResilienceIncidentCreated', {
    incidentId: incident.id,
    incidentCode: incident.incidentCode,
    severity: incident.severity,
    source: incident.source,
  });

  return incident;
}

/**
 * Transition resilience incident status with state validation.
 */
export async function transitionIncidentStatus(
  id: string,
  targetStatus: IncidentStatus,
  options?: {
    rootCause?: string;
    impactSummary?: string;
    recoveryExecutionId?: string;
  }
) {
  const incident = await db.resilienceIncident.findUnique({ where: { id } });
  if (!incident) throw new Error(`Resilience incident not found: ${id}`);

  const currentStatus = incident.status as IncidentStatus;
  if (!isValidIncidentTransition(currentStatus, targetStatus)) {
    throw new Error(`Invalid incident state transition: ${currentStatus} -> ${targetStatus}`);
  }

  const updateData: any = {
    status: targetStatus,
  };

  if (targetStatus === 'ACKNOWLEDGED' && !incident.acknowledgedAt) {
    updateData.acknowledgedAt = new Date();
  }

  if (targetStatus === 'RESOLVED') {
    updateData.resolvedAt = new Date();
    if (options?.rootCause) updateData.rootCause = options.rootCause;
    if (options?.impactSummary) updateData.impactSummary = options.impactSummary;
  }

  if (options?.recoveryExecutionId) {
    updateData.recoveryExecutionId = options.recoveryExecutionId;
  }

  const updated = await db.resilienceIncident.update({
    where: { id },
    data: updateData,
  });

  await db.recoveryAuditLog.create({
    data: {
      eventCode: generateEventCode('INCIDENT_STATUS_CHANGED'),
      incidentId: id,
      eventType: `RESILIENCE_INCIDENT_${targetStatus}`,
      message: `Incident ${incident.incidentCode} transitioned: ${currentStatus} -> ${targetStatus}`,
      correlationId: incident.correlationId,
      metadataJson: JSON.stringify(sanitizeForAudit({ currentStatus, targetStatus, options })),
    },
  });

  if (targetStatus === 'RESOLVED') {
    await eventBus.publish('ResilienceIncidentResolved', {
      incidentId: id,
      incidentCode: incident.incidentCode,
      resolvedAt: updateData.resolvedAt,
    });
  }

  return updated;
}

export async function acknowledgeResilienceIncident(id: string) {
  return transitionIncidentStatus(id, 'ACKNOWLEDGED');
}

export async function startAssessment(id: string) {
  return transitionIncidentStatus(id, 'ASSESSING');
}

export async function startRecovery(id: string, recoveryExecutionId?: string) {
  return transitionIncidentStatus(id, 'RECOVERING', { recoveryExecutionId });
}

export async function startMonitoring(id: string) {
  return transitionIncidentStatus(id, 'MONITORING');
}

export async function resolveResilienceIncident(id: string, rootCause?: string, impactSummary?: string) {
  return transitionIncidentStatus(id, 'RESOLVED', { rootCause, impactSummary });
}

export async function closeResilienceIncident(id: string) {
  return transitionIncidentStatus(id, 'CLOSED');
}

/**
 * List resilience incidents with pagination and filters.
 */
export async function listResilienceIncidents(options?: {
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  page?: number;
  pageSize?: number;
}) {
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 20;
  const where: any = {};
  if (options?.status) where.status = options.status;
  if (options?.severity) where.severity = options.severity;

  const [items, total] = await Promise.all([
    db.resilienceIncident.findMany({
      where,
      orderBy: { detectedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.resilienceIncident.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Get resilience incident details by ID.
 */
export async function getResilienceIncident(id: string) {
  return db.resilienceIncident.findUnique({
    where: { id },
  });
}

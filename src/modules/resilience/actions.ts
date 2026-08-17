'use server';

import { hasResiliencePermission, RESILIENCE_PERMISSIONS } from './permissions';
import {
  createBackupPlan,
  updateBackupPlan,
  activateBackupPlan,
  pauseBackupPlan,
  executeBackup,
  verifyBackup,
  listBackups,
  getBackupHealth,
} from './backups';
import {
  createRecoveryPlan,
  updateRecoveryPlan,
  activateRecoveryPlan,
  pauseRecoveryPlan,
  addRecoveryStep,
  executeRecoveryPlan,
  pauseRecovery,
  resumeRecovery,
  cancelRecovery,
  rollbackRecovery,
  verifyRecovery,
} from './recovery';
import {
  createDependency,
  updateDependency,
  deactivateDependency,
  listDependencies,
  getDependencyHealth,
} from './dependencies';
import {
  createContinuityPlan,
  updateContinuityPlan,
  activateContinuityPlan,
  reviewContinuityPlan,
  retireContinuityPlan,
  addContinuityProcedure,
  listContinuityPlans,
} from './continuity';
import {
  executeRecoveryDrill,
  listRecoveryDrills,
} from './drills';
import {
  createResilienceIncident,
  acknowledgeResilienceIncident,
  startAssessment,
  startRecovery,
  startMonitoring,
  resolveResilienceIncident,
  closeResilienceIncident,
  listResilienceIncidents,
} from './incidents';
import {
  getResilienceDashboard,
  getResilienceTelemetry,
  listRecoveryAuditLogs,
} from './service';
import {
  evaluateRpoCompliance,
  evaluateRtoCompliance,
  getRecoveryObjectiveStatus,
} from './objectives';
import {
  sanitizeForAudit,
  validateDangerousOperationConfirmation,
} from './security';
import { logAuditEvent } from '@/lib/audit';

export async function getResilienceDashboardAction(actorUserId: string) {
  const allowed = await hasResiliencePermission(actorUserId, RESILIENCE_PERMISSIONS.READ_OWN);
  if (!allowed) throw new Error('Unauthorized resilience dashboard access');
  const res = await getResilienceDashboard();
  return sanitizeForAudit(res);
}

export async function createBackupPlanAction(input: any, actorUserId: string) {
  const allowed = await hasResiliencePermission(actorUserId, RESILIENCE_PERMISSIONS.MANAGE_BACKUPS);
  if (!allowed) throw new Error('Unauthorized backup plan management');
  const plan = await createBackupPlan(input);
  await logAuditEvent({
    actorId: actorUserId,
    action: 'CREATE_BACKUP_PLAN',
    entityType: 'BackupPlan',
    entityId: plan.id,
    metadata: { planCode: plan.planCode },
  });
  return sanitizeForAudit(plan);
}

export async function executeBackupAction(backupPlanId: string, actorUserId: string) {
  const allowed = await hasResiliencePermission(actorUserId, RESILIENCE_PERMISSIONS.EXECUTE_BACKUP);
  if (!allowed) throw new Error('Unauthorized backup execution');
  const res = await executeBackup(backupPlanId);
  await logAuditEvent({
    actorId: actorUserId,
    action: 'EXECUTE_BACKUP',
    entityType: 'BackupExecution',
    entityId: res.id,
    metadata: { backupPlanId, status: res.status },
  });
  return sanitizeForAudit({ ...res, sizeBytes: res.sizeBytes ? res.sizeBytes.toString() : null });
}

export async function verifyBackupAction(executionId: string, actorUserId: string) {
  const allowed = await hasResiliencePermission(actorUserId, RESILIENCE_PERMISSIONS.VERIFY_BACKUP);
  if (!allowed) throw new Error('Unauthorized backup verification');
  const res = await verifyBackup(executionId);
  await logAuditEvent({
    actorId: actorUserId,
    action: 'VERIFY_BACKUP',
    entityType: 'BackupExecution',
    entityId: executionId,
    metadata: { verified: res.verified },
  });
  return sanitizeForAudit(res);
}

export async function createRecoveryPlanAction(input: any, actorUserId: string) {
  const allowed = await hasResiliencePermission(actorUserId, RESILIENCE_PERMISSIONS.MANAGE_RECOVERY);
  if (!allowed) throw new Error('Unauthorized recovery plan creation');
  const plan = await createRecoveryPlan({ ...input, createdById: actorUserId });
  await logAuditEvent({
    actorId: actorUserId,
    action: 'CREATE_RECOVERY_PLAN',
    entityType: 'RecoveryPlan',
    entityId: plan.id,
    metadata: { planCode: plan.planCode },
  });
  return sanitizeForAudit(plan);
}

export async function executeRecoveryPlanAction(
  input: any,
  confirmationToken: string,
  actorUserId: string
) {
  const allowed = await hasResiliencePermission(actorUserId, RESILIENCE_PERMISSIONS.EXECUTE_RECOVERY);
  if (!allowed) throw new Error('Unauthorized recovery execution');

  // Confirmation safeguard for dangerous recovery operation
  if (!validateDangerousOperationConfirmation(confirmationToken, 'CONFIRM_RECOVERY_EXECUTION')) {
    throw new Error('Recovery execution rejected: explicit confirmation token required');
  }

  const res = await executeRecoveryPlan({ ...input, initiatedById: actorUserId });
  await logAuditEvent({
    actorId: actorUserId,
    action: 'EXECUTE_RECOVERY_PLAN',
    entityType: 'RecoveryExecution',
    entityId: res?.id || 'unknown',
    metadata: { recoveryPlanId: input.recoveryPlanId },
  });
  return sanitizeForAudit(res);
}

export async function executeRecoveryDrillAction(input: any, actorUserId: string) {
  const allowed = await hasResiliencePermission(actorUserId, RESILIENCE_PERMISSIONS.MANAGE_DRILLS);
  if (!allowed) throw new Error('Unauthorized recovery drill execution');
  const res = await executeRecoveryDrill({ ...input, initiatedById: actorUserId });
  await logAuditEvent({
    actorId: actorUserId,
    action: 'EXECUTE_RECOVERY_DRILL',
    entityType: 'RecoveryExecution',
    entityId: res.executionId,
    metadata: { drillType: input.drillType },
  });
  return sanitizeForAudit(res);
}

export async function createResilienceIncidentAction(input: any, actorUserId: string) {
  const allowed = await hasResiliencePermission(actorUserId, RESILIENCE_PERMISSIONS.MANAGE_INCIDENTS);
  if (!allowed) throw new Error('Unauthorized incident management');
  const incident = await createResilienceIncident(input);
  await logAuditEvent({
    actorId: actorUserId,
    action: 'CREATE_RESILIENCE_INCIDENT',
    entityType: 'ResilienceIncident',
    entityId: incident.id,
    metadata: { incidentCode: incident.incidentCode, severity: incident.severity },
  });
  return sanitizeForAudit(incident);
}

export async function createContinuityPlanAction(input: any, actorUserId: string) {
  const allowed = await hasResiliencePermission(actorUserId, RESILIENCE_PERMISSIONS.MANAGE_CONTINUITY);
  if (!allowed) throw new Error('Unauthorized continuity plan management');
  const plan = await createContinuityPlan({ ...input, ownerId: actorUserId });
  await logAuditEvent({
    actorId: actorUserId,
    action: 'CREATE_CONTINUITY_PLAN',
    entityType: 'ContinuityPlan',
    entityId: plan.id,
    metadata: { planCode: plan.planCode },
  });
  return sanitizeForAudit(plan);
}

export async function createDependencyAction(input: any, actorUserId: string) {
  const allowed = await hasResiliencePermission(actorUserId, RESILIENCE_PERMISSIONS.MANAGE_DEPENDENCIES);
  if (!allowed) throw new Error('Unauthorized dependency management');
  const dep = await createDependency(input);
  await logAuditEvent({
    actorId: actorUserId,
    action: 'CREATE_RESILIENCE_DEPENDENCY',
    entityType: 'ResilienceDependency',
    entityId: dep.id,
    metadata: { dependencyCode: dep.dependencyCode },
  });
  return sanitizeForAudit(dep);
}

import { db } from '@/lib/db';
import { ResilienceDashboardDto } from './types';
import { getRecoveryObjectiveStatus } from './objectives';
import { getBackupHealth } from './backups';
import { getDependencyHealth } from './dependencies';

/**
 * Get unified dashboard data for Resilience & Business Continuity.
 */
export async function getResilienceDashboard(): Promise<ResilienceDashboardDto> {
  const [
    totalBackupPlans,
    activeBackupPlans,
    totalRecoveryPlans,
    activeRecoveryPlans,
    totalDependencies,
    activeDependencies,
    totalContinuityPlans,
    activeContinuityPlans,
    openIncidents,
    criticalIncidents,
    recentBackups,
    recentRecoveries,
    objectivesStatus,
  ] = await Promise.all([
    db.backupPlan.count(),
    db.backupPlan.count({ where: { isActive: true } }),
    db.recoveryPlan.count(),
    db.recoveryPlan.count({ where: { status: 'ACTIVE' } }),
    db.resilienceDependency.count(),
    db.resilienceDependency.count({ where: { isActive: true } }),
    db.continuityPlan.count(),
    db.continuityPlan.count({ where: { status: 'ACTIVE' } }),
    db.resilienceIncident.count({ where: { status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
    db.resilienceIncident.count({ where: { status: { notIn: ['RESOLVED', 'CLOSED'] }, severity: 'CRITICAL' } }),
    db.backupExecution.findMany({
      orderBy: { startedAt: 'desc' },
      take: 5,
      include: { backupPlan: true },
    }),
    db.recoveryExecution.findMany({
      orderBy: { startedAt: 'desc' },
      take: 5,
      include: { recoveryPlan: true, initiatedBy: { select: { name: true, email: true } } },
    }),
    getRecoveryObjectiveStatus(),
  ]);

  const rpoCompliance = objectivesStatus.every(o => o.rpoCompliant);
  const rtoCompliance = objectivesStatus.every(o => o.rtoCompliant);

  // Format Decimal/BigInt for serialization safety
  const safeRecentBackups = recentBackups.map(b => ({
    ...b,
    sizeBytes: b.sizeBytes ? b.sizeBytes.toString() : null,
  }));

  return {
    totalBackupPlans,
    activeBackupPlans,
    totalRecoveryPlans,
    activeRecoveryPlans,
    totalDependencies,
    activeDependencies,
    totalContinuityPlans,
    activeContinuityPlans,
    openIncidents,
    criticalIncidents,
    recentBackups: safeRecentBackups,
    recentRecoveries,
    rpoCompliance,
    rtoCompliance,
  };
}

/**
 * Get resilience telemetry for Prompt 18 Observability.
 */
export async function getResilienceTelemetry() {
  const [backupHealth, dependencyHealth, objectiveStatus] = await Promise.all([
    getBackupHealth(),
    getDependencyHealth(),
    getRecoveryObjectiveStatus(),
  ]);

  return {
    backupHealth,
    dependencyHealth,
    objectiveStatus,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get audit logs for resilience operations.
 */
export async function listRecoveryAuditLogs(options?: {
  eventType?: string;
  recoveryPlanId?: string;
  backupExecutionId?: string;
  recoveryExecutionId?: string;
  incidentId?: string;
  limit?: number;
}) {
  const where: any = {};
  if (options?.eventType) where.eventType = options.eventType;
  if (options?.recoveryPlanId) where.recoveryPlanId = options.recoveryPlanId;
  if (options?.backupExecutionId) where.backupExecutionId = options.backupExecutionId;
  if (options?.recoveryExecutionId) where.recoveryExecutionId = options.recoveryExecutionId;
  if (options?.incidentId) where.incidentId = options.incidentId;

  return db.recoveryAuditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 50,
  });
}

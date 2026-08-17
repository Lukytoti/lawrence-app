import { db } from '@/lib/db';
import { eventBus } from '@/lib/events';
import { RpoRtoComplianceResult } from './types';

/**
 * Calculate RPO (Recovery Point Objective) in minutes.
 * RPO = maximum acceptable data loss window.
 * Compares last successful backup time to now.
 */
export async function calculateRpo(backupPlanId: string): Promise<number> {
  const lastBackup = await db.backupExecution.findFirst({
    where: { backupPlanId, status: 'COMPLETED', verificationStatus: 'VERIFIED', completedAt: { not: null } },
    orderBy: { completedAt: 'desc' },
  });

  if (!lastBackup || !lastBackup.completedAt) {
    return Infinity; // No verified backup -> infinite RPO
  }

  const diffMs = Date.now() - lastBackup.completedAt.getTime();
  return Math.round(diffMs / 60000);
}

/**
 * Calculate RTO (Recovery Time Objective) in minutes.
 * RTO = maximum acceptable recovery duration.
 * Based on most recent recovery execution duration.
 */
export async function calculateRto(recoveryPlanId: string): Promise<number> {
  const lastRecovery = await db.recoveryExecution.findFirst({
    where: { recoveryPlanId, status: 'COMPLETED', completedAt: { not: null } },
    orderBy: { completedAt: 'desc' },
  });

  if (!lastRecovery || !lastRecovery.completedAt) {
    return Infinity; // No completed recovery -> unknown RTO
  }

  const diffMs = lastRecovery.completedAt.getTime() - lastRecovery.startedAt.getTime();
  return Math.round(diffMs / 60000);
}

/**
 * Evaluate RPO compliance for a backup plan against its policy target.
 */
export async function evaluateRpoCompliance(backupPlanId: string, targetRpoMinutes: number): Promise<RpoRtoComplianceResult> {
  const actualRpo = await calculateRpo(backupPlanId);
  const isCompliant = actualRpo <= targetRpoMinutes;

  const lastBackup = await db.backupExecution.findFirst({
    where: { backupPlanId, status: 'COMPLETED', verificationStatus: 'VERIFIED', completedAt: { not: null } },
    orderBy: { completedAt: 'desc' },
  });

  if (!isCompliant && actualRpo !== Infinity) {
    await eventBus.publish('RpoViolationDetected', {
      backupPlanId,
      targetRpoMinutes,
      actualRpoMinutes: actualRpo,
      violationMinutes: actualRpo - targetRpoMinutes,
    });
  }

  return {
    isCompliant,
    targetMinutes: targetRpoMinutes,
    actualMinutes: actualRpo,
    violationMinutes: isCompliant ? 0 : actualRpo - targetRpoMinutes,
    lastMeasuredAt: lastBackup?.completedAt ?? null,
  };
}

/**
 * Evaluate RTO compliance for a recovery plan against its target.
 */
export async function evaluateRtoCompliance(recoveryPlanId: string, targetRtoMinutes: number): Promise<RpoRtoComplianceResult> {
  const actualRto = await calculateRto(recoveryPlanId);
  const isCompliant = actualRto <= targetRtoMinutes;

  const lastRecovery = await db.recoveryExecution.findFirst({
    where: { recoveryPlanId, status: 'COMPLETED', completedAt: { not: null } },
    orderBy: { completedAt: 'desc' },
  });

  if (!isCompliant && actualRto !== Infinity) {
    await eventBus.publish('RtoViolationDetected', {
      recoveryPlanId,
      targetRtoMinutes,
      actualRtoMinutes: actualRto,
      violationMinutes: actualRto - targetRtoMinutes,
    });
  }

  return {
    isCompliant,
    targetMinutes: targetRtoMinutes,
    actualMinutes: actualRto,
    violationMinutes: isCompliant ? 0 : actualRpoToViolation(isCompliant, actualRto, targetRtoMinutes),
    lastMeasuredAt: lastRecovery?.completedAt ?? null,
  };
}

function actualRpoToViolation(isCompliant: boolean, actualRto: number, targetRtoMinutes: number): number {
  if (isCompliant) return 0;
  return actualRto === Infinity ? 999999 : actualRto - targetRtoMinutes;
}

/**
 * Get combined RPO/RTO status for all active policies.
 */
export async function getRecoveryObjectiveStatus() {
  const policies = await db.resiliencePolicy.findMany({ where: { isActive: true } });

  const results = [];
  for (const policy of policies) {
    // Find backup plans and recovery plans that match the scope
    const backupPlans = await db.backupPlan.findMany({ where: { isActive: true } });
    const recoveryPlans = await db.recoveryPlan.findMany({ where: { status: 'ACTIVE' } });

    let rpoCompliant = true;
    let rtoCompliant = true;

    for (const bp of backupPlans) {
      const rpoResult = await evaluateRpoCompliance(bp.id, policy.rpoMinutes);
      if (!rpoResult.isCompliant) rpoCompliant = false;
    }

    for (const rp of recoveryPlans) {
      const rtoResult = await evaluateRtoCompliance(rp.id, policy.rtoMinutes);
      if (!rtoResult.isCompliant) rtoCompliant = false;
    }

    results.push({
      policyCode: policy.policyCode,
      name: policy.name,
      scope: policy.scope,
      criticality: policy.criticality,
      targetRpoMinutes: policy.rpoMinutes,
      targetRtoMinutes: policy.rtoMinutes,
      rpoCompliant,
      rtoCompliant,
    });
  }

  return results;
}

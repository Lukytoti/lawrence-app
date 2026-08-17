import { db } from '@/lib/db';
import { CreateSecurityRiskInput, SecurityRiskStatus } from './types';
import { recordSecurityEvent } from './security-events';
import { eventBus } from '@/lib/events';
import crypto from 'crypto';

export function calculateRiskScore(likelihood: number, impact: number): number {
  const l = Math.max(1, Math.min(5, Math.round(likelihood)));
  const i = Math.max(1, Math.min(5, Math.round(impact)));
  return l * i;
}

export async function createSecurityRisk(
  input: CreateSecurityRiskInput,
  actorUserId?: string
) {
  const count = await db.securityRisk.count();
  const riskCode = `SECRSK-2026-${(100001 + count).toString().padStart(6, '0')}-${crypto.randomBytes(2).toString('hex')}`;
  const riskScore = calculateRiskScore(input.likelihood, input.impact);

  const risk = await db.securityRisk.create({
    data: {
      riskCode,
      title: input.title,
      description: input.description,
      category: input.category,
      severity: input.severity,
      likelihood: input.likelihood,
      impact: input.impact,
      riskScore,
      status: 'OPEN',
      ownerId: input.ownerId,
      mitigationPlan: input.mitigationPlan,
    },
  });

  if (actorUserId) {
    await recordSecurityEvent({
      eventType: 'ANOMALY_DETECTED',
      severity: input.severity,
      source: 'RISK_ENGINE',
      actorId: actorUserId,
      resourceType: 'SecurityRisk',
      resourceId: risk.id,
      action: 'CREATE_SECURITY_RISK',
      result: 'SUCCESS',
      metadata: { riskCode, riskScore, title: input.title },
    });
  }

  eventBus.publish('SecurityRiskCreated', {
    riskId: risk.id,
    riskCode: risk.riskCode,
    title: risk.title,
    riskScore: risk.riskScore,
  });

  return risk;
}

export async function transitionSecurityRisk(
  riskId: string,
  targetStatus: SecurityRiskStatus,
  actorUserId: string,
  mitigationPlan?: string
) {
  const risk = await db.securityRisk.findUnique({ where: { id: riskId } });
  if (!risk) throw new Error(`Security Risk not found: ${riskId}`);

  const updateData: any = {
    status: targetStatus,
  };
  if (mitigationPlan) updateData.mitigationPlan = mitigationPlan;
  if (targetStatus === 'RESOLVED' || targetStatus === 'CLOSED') {
    updateData.resolvedAt = new Date();
  }

  const updated = await db.securityRisk.update({
    where: { id: riskId },
    data: updateData,
  });

  await recordSecurityEvent({
    eventType: 'SYSTEM_ALERT',
    severity: updated.severity as any,
    source: 'RISK_ENGINE',
    actorId: actorUserId,
    resourceType: 'SecurityRisk',
    resourceId: updated.id,
    action: `TRANSITION_RISK_${targetStatus}`,
    result: 'SUCCESS',
    metadata: { riskCode: updated.riskCode, status: targetStatus },
  });

  if (targetStatus === 'RESOLVED' || targetStatus === 'CLOSED') {
    eventBus.publish('SecurityRiskResolved', {
      riskId: updated.id,
      riskCode: updated.riskCode,
      status: targetStatus,
    });
  }

  return updated;
}

import { db } from '@/lib/db';
import { CreateComplianceControlInput, RecordComplianceEvidenceInput } from './types';
import { recordSecurityEvent } from './security-events';
import { eventBus } from '@/lib/events';

export async function createComplianceControl(
  input: CreateComplianceControlInput,
  actorUserId?: string
) {
  const control = await db.complianceControl.create({
    data: {
      controlCode: input.controlCode,
      name: input.name,
      description: input.description,
      category: input.category,
      framework: input.framework,
      ownerRole: input.ownerRole,
      status: 'ACTIVE',
      frequency: input.frequency,
      evidenceRequired: input.evidenceRequired ?? true,
    },
  });

  if (actorUserId) {
    await recordSecurityEvent({
      eventType: 'SYSTEM_ALERT',
      severity: 'INFO',
      source: 'COMPLIANCE_ENGINE',
      actorId: actorUserId,
      resourceType: 'ComplianceControl',
      resourceId: control.id,
      action: 'CREATE_COMPLIANCE_CONTROL',
      result: 'SUCCESS',
      metadata: { controlCode: control.controlCode, framework: control.framework },
    });
  }

  return control;
}

export async function recordComplianceEvidence(
  input: RecordComplianceEvidenceInput,
  actorUserId?: string
) {
  const evidence = await db.complianceEvidence.create({
    data: {
      controlId: input.controlId,
      evidenceType: input.evidenceType,
      reference: input.reference,
      description: input.description,
      collectedById: input.collectedById || actorUserId,
      expiresAt: input.expiresAt,
      metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });

  if (actorUserId) {
    await recordSecurityEvent({
      eventType: 'SYSTEM_ALERT',
      severity: 'INFO',
      source: 'COMPLIANCE_ENGINE',
      actorId: actorUserId,
      resourceType: 'ComplianceEvidence',
      resourceId: evidence.id,
      action: 'RECORD_COMPLIANCE_EVIDENCE',
      result: 'SUCCESS',
      metadata: { controlId: input.controlId, evidenceType: input.evidenceType },
    });
  }

  return evidence;
}

export async function evaluateComplianceControl(controlId: string) {
  const control = await db.complianceControl.findUnique({
    where: { id: controlId },
    include: { evidences: true },
  });
  if (!control) throw new Error(`Compliance control not found: ${controlId}`);

  const now = new Date();
  const hasValidEvidence = control.evidences.some(
    (ev) => !ev.expiresAt || ev.expiresAt > now
  );

  let targetStatus = 'ACTIVE';
  if (control.evidenceRequired && !hasValidEvidence) {
    targetStatus = 'AT_RISK';
  }

  if (targetStatus !== control.status) {
    const updated = await db.complianceControl.update({
      where: { id: controlId },
      data: { status: targetStatus },
    });

    if (targetStatus === 'AT_RISK') {
      eventBus.publish('ComplianceControlAtRisk', {
        controlId: updated.id,
        controlCode: updated.controlCode,
        framework: updated.framework,
      });
    }

    return updated;
  }

  return control;
}

export async function calculateComplianceScore(): Promise<{
  totalControls: number;
  activeControls: number;
  atRiskControls: number;
  complianceScorePercentage: number;
}> {
  const totalControls = await db.complianceControl.count({ where: { isActive: true } });
  if (totalControls === 0) {
    return {
      totalControls: 0,
      activeControls: 0,
      atRiskControls: 0,
      complianceScorePercentage: 100,
    };
  }

  const activeControls = await db.complianceControl.count({
    where: { isActive: true, status: 'ACTIVE' },
  });
  const atRiskControls = await db.complianceControl.count({
    where: { isActive: true, status: 'AT_RISK' },
  });

  const complianceScorePercentage = Math.round((activeControls / totalControls) * 100);

  return {
    totalControls,
    activeControls,
    atRiskControls,
    complianceScorePercentage,
  };
}

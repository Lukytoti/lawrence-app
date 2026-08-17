import { db } from '@/lib/db';
import { eventBus } from '@/lib/events';
import { evaluateSVBRule, evaluateLDBRule, evaluateNDBRule } from './rules';
import { generateCompensationExplanation } from './explanations';
import { MemberCompensationCalculationResult, RuleEvaluationResult } from './types';
import { postEarning } from '@/modules/finance/service';

export async function initiateCompensationRun(
  periodId: string,
  planVersionId: string,
  userId: string,
  countryCode = 'NG'
) {
  const period = await db.qualificationPeriod.findUnique({ where: { id: periodId } });
  if (!period) throw new Error('Qualification period not found.');

  const planVersion = await db.planVersion.findUnique({ where: { id: planVersionId } });
  if (!planVersion) throw new Error('Plan version not found.');

  // Idempotency check: prevent duplicate active runs for same period/planVersion/country
  const existingRun = await db.compensationRun.findUnique({
    where: {
      periodId_planVersionId_countryCode: {
        periodId,
        planVersionId,
        countryCode,
      },
    },
  });

  if (existingRun) {
    return existingRun;
  }

  const run = await db.compensationRun.create({
    data: {
      periodId,
      planVersionId,
      countryCode,
      status: 'DRAFT',
      initiatedById: userId,
    },
  });

  await db.auditLog.create({
    data: {
      actorId: userId,
      action: 'COMPENSATION_RUN_CREATED',
      entityType: 'CompensationRun',
      entityId: run.id,
    },
  });

  await eventBus.publish('CompensationRunCreated', {
    runId: run.id,
    periodId,
    planVersionId,
    initiatedById: userId,
  }, userId);

  return run;
}

export async function calculateCompensationRun(runId: string) {
  const run = await db.compensationRun.findUnique({
    where: { id: runId },
    include: { period: true, planVersion: true },
  });

  if (!run) throw new Error('Compensation run not found.');

  if (run.status === 'POSTED') {
    throw new Error('Cannot recalculate a POSTED compensation run. Closed runs are immutable.');
  }

  if (run.period.status === 'CLOSED') {
    throw new Error('Qualification period is CLOSED. Calculations and postings are immutable.');
  }

  await db.compensationRun.update({
    where: { id: runId },
    data: { status: 'CALCULATING' },
  });

  // 1. Fetch Prompt 03A/03B qualification results (Qualification Authority)
  const memberQuals = await db.memberQualification.findMany({
    where: { periodId: run.periodId, planVersionId: run.planVersionId },
    include: {
      member: { include: { user: { include: { profile: true } } } },
      achievedRank: true,
      qualifiedRank: true,
    },
  });

  // 2. Fetch SVB rates & CompensationRules for active plan version
  const svbRates = await db.sVBRateConfig.findMany({
    where: { planVersionId: run.planVersionId },
  });

  const rules = await db.compensationRule.findMany({
    where: { planVersionId: run.planVersionId },
    orderBy: { priority: 'asc' },
  });

  const svbRule = rules.find((r) => r.category === 'SVB');
  const ldbRule = rules.find((r) => r.category === 'LDB');
  const ndbRule = rules.find((r) => r.category === 'NDB');

  let totalRunGross = 0;
  let hasWarnings = false;
  const resultSummaries: Record<string, number> = { SVB: 0, LDB: 0, NDB: 0 };
  const memberCalculationResults: MemberCompensationCalculationResult[] = [];

  for (const qual of memberQuals) {
    const earningLines: RuleEvaluationResult[] = [];
    const warnings: string[] = [];

    // Evaluate SVB Rule
    if (svbRule) {
      const svbRes = evaluateSVBRule(qual, svbRates, svbRule);
      earningLines.push(svbRes);
      if (svbRes.warning) warnings.push(svbRes.warning);
      if (svbRes.eligibilityStatus === 'UNCONFIGURED') hasWarnings = true;
      resultSummaries.SVB += svbRes.calculatedAmount;
    }

    // Evaluate LDB Rule
    if (ldbRule) {
      const ldbRes = evaluateLDBRule(qual, ldbRule);
      earningLines.push(ldbRes);
      if (ldbRes.warning) warnings.push(ldbRes.warning);
      if (ldbRes.eligibilityStatus === 'UNCONFIGURED') hasWarnings = true;
      resultSummaries.LDB += ldbRes.calculatedAmount;
    }

    // Evaluate NDB Rule
    if (ndbRule) {
      const ndbRes = evaluateNDBRule(qual, ndbRule);
      earningLines.push(ndbRes);
      if (ndbRes.warning) warnings.push(ndbRes.warning);
      if (ndbRes.eligibilityStatus === 'UNCONFIGURED') hasWarnings = true;
      resultSummaries.NDB += ndbRes.calculatedAmount;
    }

    const grossAmount = earningLines.reduce((sum, line) => sum + line.calculatedAmount, 0);
    totalRunGross += grossAmount;

    // Effective-dated Organization Relationship Lookup for target period
    const effectiveRel = await db.organizationRelationship.findFirst({
      where: {
        memberId: qual.memberId,
        relationshipType: 'SPONSOR',
        effectiveFrom: { lte: run.period.periodEnd },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: run.period.periodStart } },
        ],
      },
      include: { sponsor: true },
      orderBy: { effectiveFrom: 'desc' },
    });

    // Build self-contained complete historical snapshot JSON
    const snapshotObj = {
      planVersionId: run.planVersionId,
      planVersionName: run.planVersion.versionName,
      periodId: run.periodId,
      compensationRuleId: svbRule?.id || 'UNCONFIGURED_SVB',
      compensationRuleConfig: svbRule?.configurationJson || null,
      achievedRankCode: qual.achievedRank.code,
      achievedRankLevel: qual.achievedRank.level,
      qualifiedRankCode: qual.qualifiedRank.code,
      qualifiedRankLevel: qual.qualifiedRank.level,
      activeStatus: qual.activeStatus,
      qualifiedStatus: qual.qualifiedStatus,
      pv: Number(qual.pv),
      ppv: Number(qual.ppv),
      qpv: Number(qual.qpv),
      bv: Number(qual.bv),
      qdLegsCount: (qual as any).qdLegsCount ?? (qual as any).qdLegs ?? 0,
      groupPV: (qual as any).groupPV ? Number((qual as any).groupPV) : Number(qual.qpv),
      emeraldConsecutiveMonths: (qual as any).emeraldConsecutiveMonths ?? 0,
      effectiveOrgSponsorId: effectiveRel?.sponsorId || null,
      effectiveOrgSponsorCode: effectiveRel?.sponsor?.memberCode || null,
      effectiveFrom: effectiveRel?.effectiveFrom ? effectiveRel.effectiveFrom.toISOString() : null,
      effectiveTo: effectiveRel?.effectiveTo ? effectiveRel.effectiveTo.toISOString() : null,
      calculationVersion: run.calculationVersion,
      formulaReference: svbRule ? svbRule.code : 'UNCONFIGURED',
      evaluationTimestamp: new Date().toISOString(),
    };

    const calcResult: MemberCompensationCalculationResult = {
      memberId: qual.memberId,
      achievedRankCode: qual.achievedRank.code,
      qualifiedRankCode: qual.qualifiedRank.code,
      qualifyingQPV: Number(qual.qpv),
      qualifyingPPV: Number(qual.ppv),
      qualifyingBV: Number(qual.bv),
      grossCalculatedAmount: grossAmount,
      adjustmentsAmount: 0,
      finalPayableAmount: grossAmount,
      currency: 'NGN',
      status: 'CALCULATED',
      explanationJson: '',
      snapshotJson: JSON.stringify(snapshotObj),
      earningLines,
      warnings,
    };

    calcResult.explanationJson = generateCompensationExplanation(calcResult);
    memberCalculationResults.push(calcResult);
  }

  // Persist calculation results to database with upsert idempotency
  for (const res of memberCalculationResults) {
    const memberResult = await db.memberCompensationResult.upsert({
      where: {
        compensationRunId_memberId: {
          compensationRunId: runId,
          memberId: res.memberId,
        },
      },
      update: {
        achievedRankCode: res.achievedRankCode,
        qualifiedRankCode: res.qualifiedRankCode,
        qualifyingQPV: res.qualifyingQPV,
        qualifyingPPV: res.qualifyingPPV,
        grossCalculatedAmount: res.grossCalculatedAmount,
        finalPayableAmount: res.finalPayableAmount,
        currency: res.currency,
        status: 'CALCULATED',
        explanationJson: res.explanationJson,
        snapshotJson: res.snapshotJson,
      },
      create: {
        compensationRunId: runId,
        memberId: res.memberId,
        periodId: run.periodId,
        planVersionId: run.planVersionId,
        achievedRankCode: res.achievedRankCode,
        qualifiedRankCode: res.qualifiedRankCode,
        qualifyingQPV: res.qualifyingQPV,
        qualifyingPPV: res.qualifyingPPV,
        grossCalculatedAmount: res.grossCalculatedAmount,
        finalPayableAmount: res.finalPayableAmount,
        currency: res.currency,
        status: 'CALCULATED',
        explanationJson: res.explanationJson,
        snapshotJson: res.snapshotJson,
      },
    });

    // Recreate earning line items
    await db.earningLineItem.deleteMany({
      where: { memberCompensationResultId: memberResult.id },
    });

    for (const line of res.earningLines) {
      await db.earningLineItem.create({
        data: {
          memberCompensationResultId: memberResult.id,
          compensationRuleId: line.ruleId && line.ruleId !== 'UNCONFIGURED_SVB' ? line.ruleId : null,
          category: line.category,
          sourceMemberId: line.sourceMemberId || null,
          baseAmount: line.baseAmount,
          rateOrFormulaRef: line.rateOrFormulaRef,
          calculatedAmount: line.calculatedAmount,
          currency: res.currency,
          eligibilityStatus: line.eligibilityStatus,
          explanationJson: line.explanation,
        },
      });
    }
  }

  const finalRunStatus = hasWarnings ? 'REVIEW_REQUIRED' : 'CALCULATED';

  const updatedRun = await db.compensationRun.update({
    where: { id: runId },
    data: {
      status: finalRunStatus,
      totalMembersCount: memberCalculationResults.length,
      totalGrossAmount: totalRunGross,
      completedAt: new Date(),
      resultSummaryJson: JSON.stringify(resultSummaries),
      errorSummaryJson: hasWarnings ? JSON.stringify({ warning: 'Run contains UNCONFIGURED rules. Review required.' }) : null,
    },
  });

  await eventBus.publish('CompensationCalculated', {
    runId,
    status: finalRunStatus,
    totalMembersCount: memberCalculationResults.length,
    totalGrossAmount: totalRunGross,
  }, run.initiatedById);

  return updatedRun;
}

export async function previewCompensationRun(periodId: string, planVersionId: string) {
  const memberQuals = await db.memberQualification.findMany({
    where: { periodId, planVersionId },
    include: { achievedRank: true, qualifiedRank: true, member: true },
  });

  const svbRates = await db.sVBRateConfig.findMany({ where: { planVersionId } });
  const rules = await db.compensationRule.findMany({ where: { planVersionId } });

  const svbRule = rules.find((r) => r.category === 'SVB');
  const ldbRule = rules.find((r) => r.category === 'LDB');
  const ndbRule = rules.find((r) => r.category === 'NDB');

  let previewGross = 0;
  const items = [];

  for (const q of memberQuals) {
    const svbRes = svbRule ? evaluateSVBRule(q, svbRates, svbRule) : null;
    const ldbRes = ldbRule ? evaluateLDBRule(q, ldbRule) : null;
    const ndbRes = ndbRule ? evaluateNDBRule(q, ndbRule) : null;

    const gross = (svbRes?.calculatedAmount || 0) + (ldbRes?.calculatedAmount || 0) + (ndbRes?.calculatedAmount || 0);
    previewGross += gross;

    items.push({
      memberId: q.memberId,
      achievedRank: q.achievedRank.code,
      qualifiedRank: q.qualifiedRank.code,
      qpv: Number(q.qpv),
      grossAmount: gross,
      svbAmount: svbRes?.calculatedAmount || 0,
      svbStatus: svbRes?.eligibilityStatus || 'UNCONFIGURED',
    });
  }

  return {
    totalMembersCount: memberQuals.length,
    totalGrossAmount: previewGross,
    currency: 'NGN',
    items,
  };
}

export async function approveCompensationRun(runId: string, approverUserId: string) {
  const run = await db.compensationRun.findUnique({
    where: { id: runId },
    include: { period: true },
  });
  if (!run) throw new Error('Compensation run not found.');

  if (run.status === 'POSTED') {
    throw new Error('Cannot approve a POSTED compensation run.');
  }

  if (run.period.status === 'CLOSED') {
    throw new Error('Qualification period is CLOSED. Approval prohibited.');
  }

  if (run.status !== 'CALCULATED' && run.status !== 'REVIEW_REQUIRED') {
    throw new Error(`Cannot approve run with status '${run.status}'. Must be CALCULATED or REVIEW_REQUIRED.`);
  }

  const updatedRun = await db.compensationRun.update({
    where: { id: runId },
    data: {
      status: 'APPROVED',
      approvedById: approverUserId,
      approvedAt: new Date(),
    },
  });

  await db.memberCompensationResult.updateMany({
    where: { compensationRunId: runId },
    data: { status: 'APPROVED' },
  });

  await db.auditLog.create({
    data: {
      actorId: approverUserId,
      action: 'COMPENSATION_APPROVED',
      entityType: 'CompensationRun',
      entityId: runId,
    },
  });

  await eventBus.publish('CompensationApproved', {
    runId,
    approvedById: approverUserId,
  }, approverUserId);

  return updatedRun;
}

export async function createCompensationAdjustment(
  originalResultId: string,
  adjustedAmount: number,
  reason: string,
  actorUserId: string
) {
  const originalResult = await db.memberCompensationResult.findUnique({
    where: { id: originalResultId },
    include: { postedTransaction: true, member: true },
  });

  if (!originalResult) throw new Error('Original compensation result not found.');

  if (!reason || !reason.trim()) throw new Error('Reason required for compensation adjustment.');

  // Create offsetting journal transaction through Prompt 05 double-entry ledger
  const adjustmentReferenceNo = `ADJ-COMP-${originalResult.id.substring(0, 8)}-${Date.now()}`;
  const postedAdjustmentTxn = await postEarning({
    memberId: originalResult.memberId,
    domain: 'NETWORK_MARKETING',
    earningType: 'ADJUSTMENT',
    amount: adjustedAmount,
    currency: originalResult.currency,
    sourceEntityId: adjustmentReferenceNo,
    description: `Compensation Adjustment: ${reason.trim()}`,
    createdBy: actorUserId,
  });

  const adjustment = await db.compensationAdjustment.create({
    data: {
      originalCompensationResultId: originalResult.id,
      originalJournalTransactionId: originalResult.postedTransactionId || null,
      journalTransactionId: postedAdjustmentTxn.id,
      adjustedAmount,
      currency: originalResult.currency,
      reason: reason.trim(),
      createdByUserId: actorUserId,
    },
  });

  // Update original MemberCompensationResult adjustments sum & finalPayableAmount
  const newAdjustmentsSum = Number(originalResult.adjustmentsAmount) + adjustedAmount;
  const newFinalPayable = Number(originalResult.grossCalculatedAmount) + newAdjustmentsSum;

  await db.memberCompensationResult.update({
    where: { id: originalResultId },
    data: {
      adjustmentsAmount: newAdjustmentsSum,
      finalPayableAmount: newFinalPayable,
      status: 'ADJUSTED',
    },
  });

  await db.auditLog.create({
    data: {
      actorId: actorUserId,
      action: 'COMPENSATION_ADJUSTED',
      entityType: 'CompensationAdjustment',
      entityId: adjustment.id,
      metadata: JSON.stringify({
        originalResultId,
        adjustedAmount,
        reason,
      }),
    },
  });

  await eventBus.publish('CompensationAdjusted', {
    adjustmentId: adjustment.id,
    originalResultId,
    adjustedAmount,
    createdByUserId: actorUserId,
  }, actorUserId);

  return adjustment;
}

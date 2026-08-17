import { db } from '@/lib/db';
import { eventBus } from '@/lib/events';
import { logAuditEvent } from '@/lib/audit';
import { evaluateRequirement, MemberVolumes } from './rules';
import { resolveSVBRate, checkEmeraldConsecutiveSequence, getQualifiedDirectorLegsCount, getGroupPV } from './qualification';
import { generateQualificationExplanation } from './explanation';
import {
  RankSummary,
  NextRankProgressPayload,
  MemberQualificationSummary,
} from './types';

/**
 * Get active plan version for a country (default Nigeria 'NG').
 */
export async function getActivePlanVersion(country = 'NG') {
  const plan = await db.compensationPlan.findFirst({
    where: { country },
    include: {
      versions: {
        where: { status: 'ACTIVE' },
        include: {
          ranks: {
            orderBy: { level: 'asc' },
            include: {
              requirements: {
                include: { prerequisiteRank: true },
              },
            },
          },
          svbRates: { orderBy: { minQPV: 'asc' } },
        },
      },
    },
  });

  const activeVersion = plan?.versions[0];
  if (!activeVersion || !plan) {
    throw new Error(`No active compensation plan version found for country ${country}.`);
  }

  return {
    ...activeVersion,
    plan: {
      id: plan.id,
      name: plan.name,
      country: plan.country,
      description: plan.description,
    },
  };
}

/**
 * Get current active rank of a network member.
 */
export async function getCurrentRank(memberId: string): Promise<RankSummary> {
  const history = await db.rankHistory.findFirst({
    where: { memberId, effectiveTo: null },
    orderBy: { rank: { level: 'desc' } },
    include: { rank: { include: { requirements: true } } },
  });

  if (history?.rank) {
    return {
      id: history.rank.id,
      code: history.rank.code,
      name: history.rank.name,
      displayName: history.rank.displayName,
      level: history.rank.level,
      category: history.rank.category,
      isConfigured: history.rank.requirements.length > 0 || history.rank.level === 0,
      description: history.rank.description,
    };
  }

  const defaultVersion = await getActivePlanVersion();
  const distributor = defaultVersion.ranks.find((r) => r.code === 'DISTRIBUTOR') || defaultVersion.ranks[0];

  return {
    id: distributor.id,
    code: distributor.code,
    name: distributor.name,
    displayName: distributor.displayName,
    level: distributor.level,
    category: distributor.category,
    isConfigured: true,
    description: distributor.description,
  };
}

/**
 * Get highest achieved rank historically for a network member.
 */
export async function getHighestAchievedRank(memberId: string): Promise<RankSummary> {
  const highest = await db.rankHistory.findFirst({
    where: { memberId },
    orderBy: { rank: { level: 'desc' } },
    include: { rank: { include: { requirements: true } } },
  });

  if (highest?.rank) {
    return {
      id: highest.rank.id,
      code: highest.rank.code,
      name: highest.rank.name,
      displayName: highest.rank.displayName,
      level: highest.rank.level,
      category: highest.rank.category,
      isConfigured: highest.rank.requirements.length > 0 || highest.rank.level === 0,
      description: highest.rank.description,
    };
  }

  return getCurrentRank(memberId);
}

/**
 * Get period qualification for a member.
 */
export async function getCurrentQualification(
  memberId: string,
  periodId?: string
): Promise<MemberQualificationSummary | null> {
  let targetPeriodId = periodId;

  if (!targetPeriodId) {
    const activePeriod = await db.qualificationPeriod.findFirst({
      where: { status: 'OPEN' },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    if (!activePeriod) return null;
    targetPeriodId = activePeriod.id;
  }

  const qual = await db.memberQualification.findUnique({
    where: {
      memberId_periodId: {
        memberId,
        periodId: targetPeriodId,
      },
    },
    include: {
      period: true,
      achievedRank: true,
      qualifiedRank: true,
    },
  });

  if (!qual) return null;

  return {
    id: qual.id,
    memberId: qual.memberId,
    period: {
      id: qual.period.id,
      year: qual.period.year,
      month: qual.period.month,
      periodStart: qual.period.periodStart,
      periodEnd: qual.period.periodEnd,
      status: qual.period.status,
    },
    achievedRank: {
      id: qual.achievedRank.id,
      code: qual.achievedRank.code,
      name: qual.achievedRank.name,
      displayName: qual.achievedRank.displayName,
      level: qual.achievedRank.level,
      category: qual.achievedRank.category,
    },
    qualifiedRank: {
      id: qual.qualifiedRank.id,
      code: qual.qualifiedRank.code,
      name: qual.qualifiedRank.name,
      displayName: qual.qualifiedRank.displayName,
      level: qual.qualifiedRank.level,
      category: qual.qualifiedRank.category,
    },
    pv: Number(qual.pv),
    ppv: Number(qual.ppv),
    qpv: Number(qual.qpv),
    bv: Number(qual.bv),
    svbRatePercent: Number(qual.svbRatePercent),
    activeStatus: qual.activeStatus,
    qualifiedStatus: qual.qualifiedStatus as any,
    evaluatedAt: qual.evaluatedAt,
  };
}

/**
 * Get next actionable rank in level order (MUST HAVE CONFIGURED REQUIREMENTS).
 */
export async function getNextRank(currentLevel: number, planVersionId: string): Promise<RankSummary | null> {
  const next = await db.rank.findFirst({
    where: {
      planVersionId,
      level: { gt: currentLevel },
      isActive: true,
      requirements: {
        some: {}, // EXCLUDES UNCONFIGURED FUTURE RANKS
      },
    },
    orderBy: { level: 'asc' },
    include: { requirements: true },
  });

  if (!next) return null;

  return {
    id: next.id,
    code: next.code,
    name: next.name,
    displayName: next.displayName,
    level: next.level,
    category: next.category,
    isConfigured: next.requirements.length > 0,
    description: next.description,
  };
}

/**
 * Calculate detailed rank progress payload for member cockpit.
 */
export async function getRankProgress(
  memberId: string,
  periodId?: string
): Promise<NextRankProgressPayload> {
  const activeVersion = await getActivePlanVersion();
  const currentRank = await getCurrentRank(memberId);
  const highestAchieved = await getHighestAchievedRank(memberId);
  const currentQual = await getCurrentQualification(memberId, periodId);
  const nextRank = await getNextRank(highestAchieved.level, activeVersion.id);

  let emeraldData: { consecutiveMonths: number; history: any[] } = { consecutiveMonths: 0, history: [] };
  let qdLegsCount = 0;
  let groupPV = 0;

  if (periodId) {
    emeraldData = await checkEmeraldConsecutiveSequence(memberId, periodId);
    qdLegsCount = await getQualifiedDirectorLegsCount(memberId, periodId);
    groupPV = await getGroupPV(memberId, periodId, currentQual ? currentQual.qpv : 0);
  }

  const volumes: MemberVolumes = {
    pv: currentQual ? currentQual.pv : 0,
    ppv: currentQual ? currentQual.ppv : 0,
    qpv: currentQual ? currentQual.qpv : 0,
    bv: currentQual ? currentQual.bv : 0,
    activeStatus: currentQual ? currentQual.activeStatus : true,
    consecutiveQualifyingMonths: emeraldData.consecutiveMonths,
    qualifiedDirectorLegs: qdLegsCount,
    groupPV,
    highestAchievedLevel: highestAchieved.level,
  };

  const reqProgresses: any[] = [];
  let overallProgressPercent = 0;

  if (nextRank) {
    const rawReqs = await db.rankRequirement.findMany({
      where: { rankId: nextRank.id },
      include: { prerequisiteRank: true },
      orderBy: { sortOrder: 'asc' },
    });

    for (const r of rawReqs) {
      const p = evaluateRequirement(
        {
          id: r.id,
          requirementType: r.requirementType,
          metric: r.metric,
          threshold: r.threshold ? Number(r.threshold) : null,
          comparisonOperator: r.comparisonOperator,
          periodType: r.periodType,
          periodCount: r.periodCount,
          prerequisiteRankId: r.prerequisiteRankId,
          prerequisiteRankLevel: r.prerequisiteRank?.level,
          description: r.description,
          isRequired: r.isRequired,
        },
        volumes
      );
      reqProgresses.push(p);
    }

    if (reqProgresses.length > 0) {
      const totalPct = reqProgresses.reduce((acc, curr) => acc + curr.progressPercent, 0);
      overallProgressPercent = Math.round(totalPct / reqProgresses.length);
    }
  }

  const svbRatePercent = await resolveSVBRate(volumes.qpv, activeVersion.id);
  const qualifiedStatus = currentQual ? currentQual.qualifiedStatus : 'NOT_YET_EVALUATED';

  return {
    currentRank,
    achievedRank: highestAchieved,
    qualifiedRank: currentQual ? currentQual.qualifiedRank : currentRank,
    nextRank,
    qualifiedStatus,
    activeStatus: volumes.activeStatus,
    pv: volumes.pv,
    ppv: volumes.ppv,
    qpv: volumes.qpv,
    bv: volumes.bv,
    svbRatePercent,
    consecutiveQualifyingMonths: emeraldData.consecutiveMonths,
    requirements: reqProgresses,
    overallProgressPercent,
  };
}

/**
 * Evaluate period qualification for a member, updating database, rank history, audit logs, evaluation snapshot JSON, explanation JSON, and EventBus events.
 */
export async function evaluateMemberQualification(
  memberId: string,
  periodId: string,
  volumesInput: MemberVolumes,
  actorId?: string
) {
  const activeVersion = await getActivePlanVersion();
  const ranks = activeVersion.ranks; // Ordered level ASC

  // Fetch highest achieved rank level historically
  const highestAchieved = await getHighestAchievedRank(memberId);

  // Fetch CTE metrics for Qualified Director legs and Group PV
  const qdLegsCount = await getQualifiedDirectorLegsCount(memberId, periodId);
  const groupPV = await getGroupPV(memberId, periodId, volumesInput.qpv);
  const emeraldSeq = await checkEmeraldConsecutiveSequence(memberId, periodId);

  const volumes: MemberVolumes = {
    ...volumesInput,
    consecutiveQualifyingMonths: volumesInput.consecutiveQualifyingMonths ?? emeraldSeq.consecutiveMonths,
    qualifiedDirectorLegs: volumesInput.qualifiedDirectorLegs ?? qdLegsCount,
    groupPV: volumesInput.groupPV ?? groupPV,
    highestAchievedLevel: highestAchieved.level,
  };

  let qualifiedRank = ranks[0]; // Fallback Distributor
  let activeStatus = volumes.activeStatus;
  const evaluationSnapshotReqs: any[] = [];
  const evaluatedReqProgresses: any[] = [];

  let effectiveAchievedLevel = highestAchieved.level;

  // Evaluate ranks from lowest level to highest level
  for (const r of ranks) {
    if (r.level > 0 && r.requirements.length === 0) {
      // Unconfigured rank
      break;
    }

    const currentVolumes: MemberVolumes = {
      ...volumes,
      highestAchievedLevel: highestAchieved.level, // Strictly enforces historical preceding achievement for PREREQUISITE_RANK
    };

    let allReqsMet = true;
    for (const req of r.requirements) {
      const p = evaluateRequirement(
        {
          id: req.id,
          requirementType: req.requirementType,
          metric: req.metric,
          threshold: req.threshold ? Number(req.threshold) : null,
          comparisonOperator: req.comparisonOperator,
          periodType: req.periodType,
          periodCount: req.periodCount,
          prerequisiteRankId: req.prerequisiteRankId,
          prerequisiteRankLevel: req.prerequisiteRank?.level,
          description: req.description,
          isRequired: req.isRequired,
        },
        currentVolumes
      );

      evaluationSnapshotReqs.push({
        rankCode: r.code,
        requirementId: req.id,
        requirementType: req.requirementType,
        metric: req.metric,
        target: p.threshold,
        actual: p.currentValue,
        status: p.status,
      });

      if (r.id === qualifiedRank.id || r.level === qualifiedRank.level + 1) {
        evaluatedReqProgresses.push(p);
      }

      if (p.status !== 'COMPLETED' && req.isRequired) {
        allReqsMet = false;
        break;
      }
    }

    if (allReqsMet) {
      qualifiedRank = r;
      effectiveAchievedLevel = Math.max(effectiveAchievedLevel, r.level);
    } else {
      break; // Stop at highest rank where all requirements are met
    }
  }

  // Handle Achieved Rank update (Level progression)
  const highestRankObj = ranks.find((r) => r.id === highestAchieved.id) || ranks[0];
  let newAchievedRank = highestRankObj;
  let isNewAchievement = false;

  if (qualifiedRank.level > highestRankObj.level) {
    newAchievedRank = qualifiedRank;
    isNewAchievement = true;
  }

  // Determine qualifiedStatus (QUALIFIED vs NOT_QUALIFIED)
  const isQualifiedForAchieved = qualifiedRank.level >= newAchievedRank.level;
  const isBaseDistributorWithoutActive = newAchievedRank.level === 0 && (!activeStatus || volumes.ppv < 100);
  const qualifiedStatus = (isQualifiedForAchieved && activeStatus && !isBaseDistributorWithoutActive) ? 'QUALIFIED' : 'NOT_QUALIFIED';

  const svbRatePercent = await resolveSVBRate(volumes.qpv, activeVersion.id);

  // Generate structured explanation JSON
  const explanation = generateQualificationExplanation(
    qualifiedRank.displayName,
    qualifiedRank.code,
    isQualifiedForAchieved,
    evaluatedReqProgresses
  );
  const explanationJson = JSON.stringify(explanation);

  // Construct structured evaluation snapshot JSON
  const qualificationResultJson = JSON.stringify({
    planVersion: `${activeVersion.plan.name} (${activeVersion.versionName})`,
    evaluatedAt: new Date().toISOString(),
    volumes: {
      pv: volumes.pv,
      ppv: volumes.ppv,
      qpv: volumes.qpv,
      bv: volumes.bv,
      consecutiveMonths: volumes.consecutiveQualifyingMonths,
      qdLegs: volumes.qualifiedDirectorLegs,
      groupPV: volumes.groupPV,
    },
    achievedRank: newAchievedRank.code,
    qualifiedRank: qualifiedRank.code,
    qualifiedStatus,
    svb: {
      qpv: volumes.qpv,
      ratePercent: svbRatePercent,
    },
    requirementsEvaluated: evaluationSnapshotReqs,
  });

  // Upsert MemberQualification
  const qual = await db.memberQualification.upsert({
    where: {
      memberId_periodId: {
        memberId,
        periodId,
      },
    },
    update: {
      planVersionId: activeVersion.id,
      achievedRankId: newAchievedRank.id,
      qualifiedRankId: qualifiedRank.id,
      pv: volumes.pv,
      ppv: volumes.ppv,
      qpv: volumes.qpv,
      bv: volumes.bv,
      svbRatePercent,
      activeStatus,
      qualifiedStatus,
      qualificationResultJson,
      explanationJson,
      evaluatedAt: new Date(),
    },
    create: {
      memberId,
      periodId,
      planVersionId: activeVersion.id,
      achievedRankId: newAchievedRank.id,
      qualifiedRankId: qualifiedRank.id,
      pv: volumes.pv,
      ppv: volumes.ppv,
      qpv: volumes.qpv,
      bv: volumes.bv,
      svbRatePercent,
      activeStatus,
      qualifiedStatus,
      qualificationResultJson,
      explanationJson,
      evaluatedAt: new Date(),
    },
  });

  // Record RankHistory if new rank achievement
  if (isNewAchievement) {
    await db.rankHistory.create({
      data: {
        memberId,
        rankId: newAchievedRank.id,
        achievedAt: new Date(),
        effectiveFrom: new Date(),
        source: 'SYSTEM_EVALUATION',
        notes: `Achieved rank: ${newAchievedRank.name} (${volumes.qpv} QPV)`,
      },
    });

    await eventBus.publish('RankAchieved', { memberId, rankId: newAchievedRank.id, rankName: newAchievedRank.name }, actorId);

    await logAuditEvent({
      actorId,
      action: 'RANK_ACHIEVED',
      entityType: 'Rank',
      entityId: newAchievedRank.id,
      metadata: { memberId, rankCode: newAchievedRank.code, qpv: volumes.qpv },
    });
  }

  await eventBus.publish('RankQualificationEvaluated', { memberId, periodId, qualifiedStatus }, actorId);

  await logAuditEvent({
    actorId,
    action: 'QUALIFICATION_EVALUATED',
    entityType: 'MemberQualification',
    entityId: qual.id,
    metadata: { memberId, periodId, qpv: volumes.qpv, qualifiedStatus },
  });

  return qual;
}

/**
 * Fetch member full rank history log.
 */
export async function getRankHistory(memberId: string) {
  return db.rankHistory.findMany({
    where: { memberId },
    orderBy: { achievedAt: 'desc' },
    include: { rank: true },
  });
}

/**
 * Fetch member qualification history across periods.
 */
export async function getQualificationHistory(memberId: string) {
  return db.memberQualification.findMany({
    where: { memberId },
    orderBy: [{ period: { year: 'desc' } }, { period: { month: 'desc' } }],
    include: {
      period: true,
      achievedRank: true,
      qualifiedRank: true,
    },
  });
}

/**
 * Get organization-wide rank & qualification metrics for Master Dashboard integration.
 */
export async function getOrganizationRankMetrics() {
  const activePeriod = await db.qualificationPeriod.findFirst({
    where: { status: 'OPEN' },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  });

  if (!activePeriod) {
    return {
      qualifiedDirectorsCount: 0,
      totalQPV: 0,
      qualifiedMembersCount: 0,
      unqualifiedMembersCount: 0,
    };
  }

  const quals = await db.memberQualification.findMany({
    where: { periodId: activePeriod.id },
    include: { qualifiedRank: true },
  });

  let qualifiedDirectorsCount = 0;
  let totalQPV = 0;
  let qualifiedMembersCount = 0;
  let unqualifiedMembersCount = 0;

  for (const q of quals) {
    totalQPV += Number(q.qpv);
    if (q.qualifiedStatus === 'QUALIFIED') {
      qualifiedMembersCount++;
    } else {
      unqualifiedMembersCount++;
    }
    if (q.qualifiedRank.level >= 4) {
      qualifiedDirectorsCount++;
    }
  }

  return {
    qualifiedDirectorsCount,
    totalQPV,
    qualifiedMembersCount,
    unqualifiedMembersCount,
  };
}

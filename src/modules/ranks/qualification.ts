import { db } from '@/lib/db';

/**
 * Resolve SVB rate percentage based on QPV amount and PlanVersion SVB rate table.
 */
export async function resolveSVBRate(qpvAmount: number, planVersionId: string): Promise<number> {
  const rates = await db.sVBRateConfig.findMany({
    where: { planVersionId },
    orderBy: { minQPV: 'asc' },
  });

  let applicableRate = 0;

  for (const rate of rates) {
    const min = Number(rate.minQPV);
    const max = rate.maxQPV ? Number(rate.maxQPV) : Infinity;

    if (qpvAmount >= min && qpvAmount <= max) {
      applicableRate = Number(rate.ratePercent);
    }
  }

  return applicableRate;
}

/**
 * Evaluate consecutive qualifying months for Emerald Director (e.g. 4,000 QPV).
 * Returns the exact count of UNBROKEN consecutive preceding qualifying months leading up to and including current period.
 */
export async function checkEmeraldConsecutiveSequence(
  memberId: string,
  currentPeriodId: string,
  targetQPV = 4000
): Promise<{ consecutiveMonths: number; history: { year: number; month: number; qpv: number; qualified: boolean }[] }> {
  const currentPeriod = await db.qualificationPeriod.findUnique({
    where: { id: currentPeriodId },
  });

  if (!currentPeriod) {
    return { consecutiveMonths: 0, history: [] };
  }

  const pastQuals = await db.memberQualification.findMany({
    where: {
      memberId,
      period: {
        periodEnd: { lte: currentPeriod.periodEnd },
      },
    },
    include: { period: true },
    orderBy: [{ period: { year: 'desc' } }, { period: { month: 'desc' } }],
    take: 12,
  });

  let consecutiveMonths = 0;
  const history: { year: number; month: number; qpv: number; qualified: boolean }[] = [];

  for (const qual of pastQuals) {
    const qpv = Number(qual.qpv);
    const isQualifying = qpv >= targetQPV;

    history.push({
      year: qual.period.year,
      month: qual.period.month,
      qpv,
      qualified: isQualifying,
    });

    if (isQualifying) {
      consecutiveMonths++;
    } else {
      break;
    }
  }

  return { consecutiveMonths, history };
}

/**
 * PostgreSQL Recursive CTE query to count first-level leg branches containing at least one Qualified Director or higher (level >= 4).
 */
export async function getQualifiedDirectorLegsCount(memberId: string, periodId: string): Promise<number> {
  const result = await db.$queryRaw<Array<{ leg_count: bigint }>>`
    SELECT COUNT(DISTINCT r."memberId") AS leg_count
    FROM "OrganizationRelationship" r
    WHERE r."sponsorId" = ${memberId}
      AND r."effectiveTo" IS NULL
      AND r."relationshipType" = 'SPONSOR'
      AND EXISTS (
        WITH RECURSIVE leg_nodes AS (
          SELECT r."memberId"
          UNION ALL
          SELECT sub."memberId"
          FROM "OrganizationRelationship" sub
          INNER JOIN leg_nodes n ON sub."sponsorId" = n."memberId"
          WHERE sub."effectiveTo" IS NULL AND sub."relationshipType" = 'SPONSOR'
        )
        SELECT 1 FROM leg_nodes ln
        INNER JOIN "MemberQualification" mq ON mq."memberId" = ln."memberId"
        INNER JOIN "Rank" rk ON rk."id" = mq."qualifiedRankId"
        WHERE mq."periodId" = ${periodId}
          AND mq."qualifiedStatus" = 'QUALIFIED'
          AND rk."level" >= 4
      );
  `;

  return result[0]?.leg_count ? Number(result[0].leg_count) : 0;
}

/**
 * PostgreSQL Recursive CTE query to calculate Group PV (Member QPV + QPV of Qualified Directors within 3 levels).
 */
export async function getGroupPV(memberId: string, periodId: string, memberSelfQPV = 0): Promise<number> {
  const result = await db.$queryRaw<Array<{ group_pv: string | number }>>`
    WITH RECURSIVE group_nodes AS (
      SELECT ${memberId}::text AS "memberId", 0 AS level
      
      UNION ALL
      
      SELECT sub."memberId", g.level + 1
      FROM "OrganizationRelationship" sub
      INNER JOIN group_nodes g ON sub."sponsorId" = g."memberId"
      WHERE sub."effectiveTo" IS NULL 
        AND sub."relationshipType" = 'SPONSOR'
        AND g.level < 3
    )
    SELECT COALESCE(SUM(mq.qpv), 0)::numeric AS group_pv
    FROM group_nodes gn
    INNER JOIN "MemberQualification" mq ON mq."memberId" = gn."memberId"
    INNER JOIN "Rank" rk ON rk."id" = mq."qualifiedRankId"
    WHERE mq."periodId" = ${periodId}
      AND (gn.level = 0 OR (mq."qualifiedStatus" = 'QUALIFIED' AND rk."level" >= 4));
  `;

  const fetched = result[0]?.group_pv ? Number(result[0].group_pv) : 0;
  return Math.max(memberSelfQPV, fetched);
}

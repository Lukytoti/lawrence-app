import {
  queryOrganizationAnalytics,
  queryRankAnalytics,
  queryQualificationAnalytics,
  queryCompensationAnalytics,
  queryFinancialAnalytics,
  queryCrmAnalytics,
  queryProductivityAnalytics,
  queryEngagementAnalytics,
  queryLeadershipAttentionSignals,
  getDownlineMemberIdsCTE,
} from './queries';
import {
  calculateMetricTrend,
  getMonthlyMemberGrowthTrend,
  getMonthlyQpvTrend,
  getMonthlyQualificationRateTrend,
  getMonthlyCompensationTrend,
  getMonthlyCrmConversionTrend,
  getMonthlyProductivityTrend,
  getMonthlyEngagementTrend,
} from './trends';
import {
  ExecutiveDashboardDataDTO,
  AnalyticsScopeType,
  AnomalySignalDTO,
  MetricValueWithTrend,
} from './types';
import { hasPermission } from '@/lib/rbac';
import { db } from '@/lib/db';

/**
 * Rule-Based Anomaly Detector (Conservative, non-ML, neutral terminology)
 */
export function detectAnalyticsAnomalies(
  currentQpv: number,
  previousQpv: number,
  currentConversion: number,
  previousConversion: number,
  currentWithdrawals: number,
  previousWithdrawals: number
): AnomalySignalDTO[] {
  const anomalies: AnomalySignalDTO[] = [];

  // QPV Drop Anomaly (>25% drop)
  if (previousQpv > 0) {
    const qpvDrop = ((previousQpv - currentQpv) / previousQpv) * 100;
    if (qpvDrop > 25) {
      anomalies.push({
        metricKey: 'qpv_drop',
        baselineValue: previousQpv,
        currentValue: currentQpv,
        difference: Number((currentQpv - previousQpv).toFixed(2)),
        percentageChange: Number((-qpvDrop).toFixed(2)),
        severity: qpvDrop > 50 ? 'CRITICAL' : 'HIGH',
        explanation: `Significant QPV volume drop detected (${qpvDrop.toFixed(1)}% reduction compared to previous period baseline). ATTENTION REQUIRED.`,
      });
    }
  }

  // CRM Conversion Shift Anomaly (>30% shift)
  if (previousConversion > 0) {
    const convShift = ((previousConversion - currentConversion) / previousConversion) * 100;
    if (convShift > 30) {
      anomalies.push({
        metricKey: 'crm_conversion_drop',
        baselineValue: previousConversion,
        currentValue: currentConversion,
        difference: Number((currentConversion - previousConversion).toFixed(2)),
        percentageChange: Number((-convShift).toFixed(2)),
        severity: 'MEDIUM',
        explanation: `CRM conversion rate decline detected (${convShift.toFixed(1)}% reduction). UNUSUAL CHANGE in prospect conversion pipeline.`,
      });
    }
  }

  // Unusual Withdrawal Pattern Anomaly (>200% surge)
  if (previousWithdrawals > 0 && currentWithdrawals > previousWithdrawals * 2) {
    const surgePct = ((currentWithdrawals - previousWithdrawals) / previousWithdrawals) * 100;
    anomalies.push({
      metricKey: 'withdrawal_surge',
      baselineValue: previousWithdrawals,
      currentValue: currentWithdrawals,
      difference: Number((currentWithdrawals - previousWithdrawals).toFixed(2)),
      percentageChange: Number(surgePct.toFixed(2)),
      severity: 'HIGH',
      explanation: `Unusual withdrawal request surge detected (${surgePct.toFixed(1)}% increase over previous baseline). ATTENTION REQUIRED.`,
    });
  }

  return anomalies;
}

/**
 * Consolidated Executive Intelligence Dashboard Orchestrator
 */
export async function getExecutiveDashboardData(
  userId: string,
  targetScopeType: AnalyticsScopeType = 'GLOBAL',
  targetScopeId?: string,
  periodId?: string
): Promise<ExecutiveDashboardDataDTO> {
  const isSuperAdmin = await hasPermission(userId, 'analytics:read_all');
  const isLeader = await hasPermission(userId, 'analytics:read_team');
  const canViewFinancial = await hasPermission(userId, 'analytics:financial');
  const canViewCompensation = await hasPermission(userId, 'analytics:compensation');

  let memberIdsScope: string[] | undefined = undefined;

  if (targetScopeType === 'MEMBER') {
    memberIdsScope = targetScopeId ? [targetScopeId] : [];
  } else if (targetScopeType === 'TEAM' || (!isSuperAdmin && isLeader)) {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { networkMember: true },
    });

    const rootMemberId = targetScopeId || user?.networkMember?.id;
    if (rootMemberId) {
      memberIdsScope = await getDownlineMemberIdsCTE(rootMemberId);
    }
  }

  const organization = await queryOrganizationAnalytics(memberIdsScope);
  const rankPerformance = await queryRankAnalytics(periodId, memberIdsScope);
  const qualification = await queryQualificationAnalytics(periodId, memberIdsScope);
  const crm = await queryCrmAnalytics(targetScopeType === 'MEMBER' ? userId : undefined);
  const productivity = await queryProductivityAnalytics(memberIdsScope);
  const engagement = await queryEngagementAnalytics(memberIdsScope);
  const attentionSignals = await queryLeadershipAttentionSignals(memberIdsScope);

  const compensation = canViewCompensation ? await queryCompensationAnalytics(periodId, memberIdsScope) : undefined;
  const financial = canViewFinancial ? await queryFinancialAnalytics(memberIdsScope) : undefined;

  // Trend metrics
  const kpismatrix: MetricValueWithTrend[] = [
    getMonthlyMemberGrowthTrend(organization.totalMembers, Math.max(1, organization.totalMembers - organization.newMembersThisPeriod)),
    getMonthlyQpvTrend(qualification.totalQpv, qualification.totalQpv * 0.9),
    getMonthlyQualificationRateTrend(qualification.qualificationRate, 75.0),
    getMonthlyCrmConversionTrend(crm.conversionRate, 20.0),
    getMonthlyProductivityTrend(productivity.monthlyScoreAverage, 80.0),
    getMonthlyEngagementTrend(engagement.averageEngagementScore, 75.0),
  ];

  if (canViewCompensation && compensation) {
    kpismatrix.push(getMonthlyCompensationTrend(compensation.totalPostedAmount, compensation.totalPostedAmount * 0.85));
  }

  const anomalies = detectAnalyticsAnomalies(
    qualification.totalQpv,
    qualification.totalQpv * 1.3, // Baseline test check
    crm.conversionRate,
    crm.conversionRate,
    financial?.approvedPaymentsAmount || 0,
    100
  );

  return {
    periodId,
    scopeType: targetScopeType,
    scopeId: targetScopeId,
    organization,
    rankPerformance,
    qualification,
    compensation,
    financial,
    crm,
    productivity,
    engagement,
    attentionSignals,
    anomalies,
    kpismatrix,
  };
}

/**
 * Creates or updates an analytical snapshot cache record
 */
export async function createAnalyticsSnapshot(
  scopeType: AnalyticsScopeType,
  scopeId: string | undefined,
  periodId: string | undefined,
  metricKey: string,
  metricValue: number,
  metricUnit: string,
  metadataObj?: any
) {
  return await db.analyticsSnapshot.create({
    data: {
      scopeType,
      scopeId,
      periodId,
      metricKey,
      metricValue,
      metricUnit,
      metadataJson: metadataObj ? JSON.stringify(metadataObj) : null,
      calculatedAt: new Date(),
    },
  });
}

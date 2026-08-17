import { db } from '@/lib/db';
import {
  GovernanceDashboardDto,
  SecurityDashboardDto,
  ComplianceDashboardDto,
} from './types';
import { calculateComplianceScore } from './compliance';

export async function getGovernanceOverview(actorUserId: string): Promise<GovernanceDashboardDto> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalSecurityEventsToday,
    openIncidentsCount,
    pendingAccessReviewsCount,
    openRisksCount,
    complianceScore,
    recentSecurityEvents,
    activeIncidents,
    urgentRisks,
  ] = await Promise.all([
    db.platformSecurityEvent.count({ where: { createdAt: { gte: todayStart } } }),
    db.securityIncident.count({ where: { status: { in: ['OPEN', 'ACKNOWLEDGED', 'INVESTIGATING', 'CONTAINED'] } } }),
    db.accessReview.count({ where: { status: { in: ['PENDING', 'IN_REVIEW'] } } }),
    db.securityRisk.count({ where: { status: { in: ['OPEN', 'MITIGATING'] } } }),
    calculateComplianceScore(),
    db.platformSecurityEvent.findMany({ take: 10, orderBy: { createdAt: 'desc' } }),
    db.securityIncident.findMany({
      where: { status: { notIn: ['RESOLVED', 'CLOSED'] } },
      take: 5,
      orderBy: { createdAt: 'desc' },
    }),
    db.securityRisk.findMany({
      where: { status: { notIn: ['RESOLVED', 'CLOSED'] } },
      take: 5,
      orderBy: { riskScore: 'desc' },
    }),
  ]);

  return {
    totalSecurityEventsToday,
    openIncidentsCount,
    pendingAccessReviewsCount,
    activeComplianceControlsCount: complianceScore.activeControls,
    complianceScorePercentage: complianceScore.complianceScorePercentage,
    openRisksCount,
    overallSystemHealth: openIncidentsCount > 0 ? 'DEGRADED' : 'HEALTHY',
    recentSecurityEvents,
    activeIncidents,
    urgentRisks,
  };
}

export async function getSecurityOverview(): Promise<SecurityDashboardDto> {
  const h24 = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    totalEvents24h,
    criticalEventsCount,
    blockedRateLimitEventsCount,
    secretExposureAttemptsCount,
    recentEvents,
  ] = await Promise.all([
    db.platformSecurityEvent.count({ where: { createdAt: { gte: h24 } } }),
    db.platformSecurityEvent.count({ where: { severity: 'CRITICAL', createdAt: { gte: h24 } } }),
    db.rateLimitEvent.count({ where: { blocked: true, createdAt: { gte: h24 } } }),
    db.platformSecurityEvent.count({ where: { eventType: 'SECRET_EXPOSURE_ATTEMPT', createdAt: { gte: h24 } } }),
    db.platformSecurityEvent.findMany({ take: 20, orderBy: { createdAt: 'desc' } }),
  ]);

  return {
    totalEvents24h,
    criticalEventsCount,
    blockedRateLimitEventsCount,
    secretExposureAttemptsCount,
    recentEvents,
  };
}

export async function getComplianceOverview(): Promise<ComplianceDashboardDto> {
  const score = await calculateComplianceScore();

  const expiredEvidenceCount = await db.complianceEvidence.count({
    where: { expiresAt: { lt: new Date() } },
  });

  const recentEvidences = await db.complianceEvidence.findMany({
    take: 10,
    orderBy: { collectedAt: 'desc' },
    include: { control: true },
  });

  const controls = await db.complianceControl.findMany({ where: { isActive: true } });
  const frameworkBreakdown: Record<string, { total: number; active: number }> = {};

  for (const c of controls) {
    if (!frameworkBreakdown[c.framework]) {
      frameworkBreakdown[c.framework] = { total: 0, active: 0 };
    }
    frameworkBreakdown[c.framework].total += 1;
    if (c.status === 'ACTIVE') {
      frameworkBreakdown[c.framework].active += 1;
    }
  }

  return {
    totalControls: score.totalControls,
    activeControls: score.activeControls,
    atRiskControls: score.atRiskControls,
    complianceScorePercentage: score.complianceScorePercentage,
    frameworkBreakdown,
    expiredEvidenceCount,
    recentEvidences,
  };
}

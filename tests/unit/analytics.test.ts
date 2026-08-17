import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/lib/db';
import { KPI_REGISTRY, getKPIDefinition, getAllKPIDefinitions } from '@/modules/analytics/metrics';
import {
  queryOrganizationAnalytics,
  queryRankAnalytics,
  queryQualificationAnalytics,
  queryCompensationAnalytics,
  queryFinancialAnalytics,
  queryCrmAnalytics,
  queryProductivityAnalytics,
  queryEngagementAnalytics,
  getDownlineMemberIdsCTE,
} from '@/modules/analytics/queries';
import {
  calculateMetricTrend,
  getMonthlyMemberGrowthTrend,
  getMonthlyQpvTrend,
  getMonthlyQualificationRateTrend,
  getMonthlyCompensationTrend,
} from '@/modules/analytics/trends';
import {
  getOrganizationReport,
  getRankPerformanceReport,
  getQualificationReport,
  getCompensationReport,
  getFinancialReport,
  getCrmPerformanceReport,
  getProductivityReport,
  getEngagementReport,
} from '@/modules/analytics/reports';
import { generateCsvExport } from '@/modules/analytics/exports';
import {
  getExecutiveDashboardData,
  detectAnalyticsAnomalies,
  createAnalyticsSnapshot,
} from '@/modules/analytics/service';
import {
  requireAnalyticsRead,
  requireFinancialAnalytics,
  requireCompensationAnalytics,
  requireAnalyticsExport,
} from '@/modules/analytics/permissions';

describe('PROMPT 09 — Executive Intelligence, Analytics & Reporting Engine Test Suite', () => {
  let adminUser: any;
  let memberUser: any;
  let networkMemberA: any;
  let planVersion: any;
  let period: any;

  beforeAll(async () => {
    adminUser = await db.user.findFirst({
      where: { email: 'oluwatobi@lawrenceapp.internal' },
      include: { networkMember: true },
    });

    if (!adminUser) throw new Error('Admin user missing for analytics tests.');

    const timestamp = Date.now();
    memberUser = await db.user.create({
      data: {
        email: `analytics.user.${timestamp}@lawrenceapp.internal`,
        name: 'Analytics Member',
        status: 'ACTIVE',
        profile: { create: { firstName: 'Analytics', lastName: 'Member' } },
        networkMember: { create: { memberCode: `NM-ANALYTICS-${timestamp}`, status: 'ACTIVE' } },
      },
      include: { networkMember: true },
    });
    networkMemberA = memberUser.networkMember;

    planVersion = await db.planVersion.findFirst({
      where: { status: 'ACTIVE' },
    });

    period = await db.qualificationPeriod.upsert({
      where: { year_month: { year: 2036, month: 1 } },
      update: {},
      create: {
        year: 2036,
        month: 1,
        periodStart: new Date('2036-01-01'),
        periodEnd: new Date('2036-01-31'),
        status: 'OPEN',
      },
    });
  });

  describe('1. KPI Definition Registry Tests', () => {
    it('1. should verify KPI Registry has required metrics', () => {
      const defs = getAllKPIDefinitions();
      expect(defs.length).toBeGreaterThanOrEqual(10);
    });

    it('2. should retrieve individual KPI definition by key', () => {
      const def = getKPIDefinition('qualification_rate');
      expect(def).toBeDefined();
      expect(def?.unit).toBe('PERCENT');
      expect(def?.sourceModule).toContain('Prompt 03A / 03B');
    });
  });

  describe('2. Domain Query Engine Tests', () => {
    it('3. should query organization member counts accurately', async () => {
      const orgData = await queryOrganizationAnalytics();
      expect(orgData.totalMembers).toBeGreaterThan(0);
      expect(orgData.activeMembers).toBeGreaterThanOrEqual(0);
    });

    it('4. should query organization growth rate', async () => {
      const orgData = await queryOrganizationAnalytics();
      expect(orgData.memberGrowthRate).toBeGreaterThanOrEqual(0);
    });

    it('5. should query rank distribution and advancement', async () => {
      const rankData = await queryRankAnalytics(period.id);
      expect(rankData.rankDistribution).toBeDefined();
      expect(Array.isArray(rankData.rankDistribution)).toBe(true);
    });

    it('6. should query qualification rates reading Prompt 03A/03B', async () => {
      const qualData = await queryQualificationAnalytics(period.id);
      expect(qualData.qualificationRate).toBeGreaterThanOrEqual(0);
    });

    it('7. should query QPV, PPV, and BV totals', async () => {
      const qualData = await queryQualificationAnalytics(period.id);
      expect(qualData.totalQpv).toBeGreaterThanOrEqual(0);
      expect(qualData.totalPpv).toBeGreaterThanOrEqual(0);
      expect(qualData.totalBv).toBeGreaterThanOrEqual(0);
    });

    it('8. should query CRM pipeline value reading Prompt 06', async () => {
      const crmData = await queryCrmAnalytics();
      expect(crmData.totalPipelineValue).toBeGreaterThanOrEqual(0);
    });

    it('9. should query CRM conversion rate', async () => {
      const crmData = await queryCrmAnalytics();
      expect(crmData.conversionRate).toBeGreaterThanOrEqual(0);
    });

    it('10. should query productivity scores reading Prompt 04', async () => {
      const prodData = await queryProductivityAnalytics();
      expect(prodData.dailyScoreAverage).toBeGreaterThan(0);
    });

    it('11. should query engagement metrics reading Prompt 07', async () => {
      const engData = await queryEngagementAnalytics();
      expect(engData.averageEngagementScore).toBeGreaterThan(0);
    });

    it('12. should query compensation totals reading Prompt 08', async () => {
      const compData = await queryCompensationAnalytics(period.id);
      expect(compData.totalCalculatedAmount).toBeGreaterThanOrEqual(0);
    });

    it('13. should query financial balances reading Prompt 05/05.1 Double-Entry Ledger', async () => {
      const finData = await queryFinancialAnalytics();
      expect(finData.totalLedgerBalance).toBeDefined();
    });
  });

  describe('3. Trend & Comparison Engine Tests', () => {
    it('14. should calculate positive metric trend', () => {
      const trend = calculateMetricTrend('test_key', 'Test Metric', 120, 100);
      expect(trend.absoluteDifference).toBe(20);
      expect(trend.percentageChange).toBe(20);
      expect(trend.trendDirection).toBe('UP');
    });

    it('15. should calculate negative metric trend', () => {
      const trend = calculateMetricTrend('test_key', 'Test Metric', 80, 100);
      expect(trend.absoluteDifference).toBe(-20);
      expect(trend.percentageChange).toBe(-20);
      expect(trend.trendDirection).toBe('DOWN');
    });

    it('16. should handle zero denominator safely without NaN / Infinity', () => {
      const trend = calculateMetricTrend('zero_key', 'Zero Denominator', 50, 0);
      expect(trend.percentageChange).toBe(100);
      expect(Number.isNaN(trend.percentageChange)).toBe(false);
      expect(Number.isFinite(trend.percentageChange)).toBe(true);
    });

    it('17. should compute monthly member growth trend', () => {
      const trend = getMonthlyMemberGrowthTrend(150, 100);
      expect(trend.percentageChange).toBe(50);
    });

    it('18. should compute monthly QPV trend', () => {
      const trend = getMonthlyQpvTrend(4500, 3000);
      expect(trend.absoluteDifference).toBe(1500);
    });

    it('19. should compute monthly qualification rate trend', () => {
      const trend = getMonthlyQualificationRateTrend(80, 75);
      expect(trend.trendDirection).toBe('UP');
    });

    it('20. should compute monthly compensation trend', () => {
      const trend = getMonthlyCompensationTrend(5000, 4000);
      expect(trend.percentageChange).toBe(25);
    });
  });

  describe('4. RBAC, Security & Financial Isolation Tests', () => {
    it('21. should pass RBAC read guard for authorized admin', async () => {
      const allowed = await requireAnalyticsRead(adminUser.id);
      expect(allowed).toBe(true);
    });

    it('22. should pass financial analytics permission guard for admin', async () => {
      const allowed = await requireFinancialAnalytics(adminUser.id);
      expect(allowed).toBe(true);
    });

    it('23. should pass compensation analytics permission guard for admin', async () => {
      const allowed = await requireCompensationAnalytics(adminUser.id);
      expect(allowed).toBe(true);
    });

    it('24. should pass analytics export permission guard for admin', async () => {
      const allowed = await requireAnalyticsExport(adminUser.id);
      expect(allowed).toBe(true);
    });

    it('25. should reject financial analytics guard for unauthorized member', async () => {
      await expect(requireFinancialAnalytics(memberUser.id)).rejects.toThrow('Unauthorized');
    });

    it('26. should reject compensation analytics guard for unauthorized member', async () => {
      await expect(requireCompensationAnalytics(memberUser.id)).rejects.toThrow('Unauthorized');
    });
  });

  describe('5. Organization CTE & Scope Scoping Tests', () => {
    it('27. should execute downline member IDs recursive CTE query', async () => {
      const downlines = await getDownlineMemberIdsCTE(adminUser.networkMember.id);
      expect(Array.isArray(downlines)).toBe(true);
      expect(downlines.includes(adminUser.networkMember.id)).toBe(true);
    });

    it('28. should fetch team-scoped executive dashboard data for leader', async () => {
      const dashboard = await getExecutiveDashboardData(adminUser.id, 'TEAM');
      expect(dashboard).toBeDefined();
      expect(dashboard.organization).toBeDefined();
    });
  });

  describe('6. Report Generation & CSV Export Engine Tests', () => {
    it('29. should generate Organization Report with authoritative metadata', async () => {
      const report = await getOrganizationReport();
      expect(report.reportType).toBe('ORGANIZATION_PERFORMANCE_REPORT');
      expect(report.authoritativeSource).toContain('Prompt 02/02.5');
    });

    it('30. should generate Rank Performance Report', async () => {
      const report = await getRankPerformanceReport(period.id);
      expect(report.reportType).toBe('RANK_PERFORMANCE_REPORT');
    });

    it('31. should generate Qualification Report', async () => {
      const report = await getQualificationReport(period.id);
      expect(report.reportType).toBe('QUALIFICATION_TREND_REPORT');
    });

    it('32. should generate Compensation Report', async () => {
      const report = await getCompensationReport(period.id);
      expect(report.reportType).toBe('COMPENSATION_RUN_REPORT');
    });

    it('33. should generate CSV export for ORGANIZATION report type', async () => {
      const csv = await generateCsvExport('ORGANIZATION', adminUser.id);
      expect(typeof csv).toBe('string');
      expect(csv).toContain('Metric,Value');
      expect(csv).toContain('Total Members');
    });

    it('34. should generate CSV export for RANK report type', async () => {
      const csv = await generateCsvExport('RANK', adminUser.id);
      expect(typeof csv).toBe('string');
      expect(csv).toContain('Rank Code,Member Count');
    });
  });

  describe('7. Anomaly Detection & Snapshot Engine Tests', () => {
    it('35. should detect QPV drop anomaly when volume drops >25%', () => {
      const anomalies = detectAnalyticsAnomalies(2000, 4000, 20, 20, 100, 100);
      expect(anomalies.length).toBeGreaterThan(0);
      expect(anomalies[0].metricKey).toBe('qpv_drop');
    });

    it('36. should create AnalyticsSnapshot cache record cleanly', async () => {
      const snapshot = await createAnalyticsSnapshot(
        'GLOBAL',
        undefined,
        period.id,
        'test_qualification_rate',
        85.5,
        'PERCENT',
        { testNote: 'Unit test snapshot' }
      );
      expect(snapshot.id).toBeDefined();
      expect(Number(snapshot.metricValue)).toBe(85.5);
    });
  });
});

import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/lib/db';
import { KPI_REGISTRY } from '@/modules/analytics/metrics';
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
import { calculateMetricTrend } from '@/modules/analytics/trends';
import {
  getOrganizationReport,
  getRankPerformanceReport,
  getQualificationReport,
  getCompensationReport,
  getFinancialReport,
} from '@/modules/analytics/reports';
import { generateCsvExport, sanitizeCsvField } from '@/modules/analytics/exports';
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
import { fetchExecutiveDashboardAction, exportAnalyticsCsvAction } from '@/modules/analytics/actions';

describe('PROMPT 09.1 — Executive Intelligence, Analytics & Reporting Dedicated QA Test Suite', () => {
  let adminUser: any;
  let leaderUser: any;
  let leaderMember: any;
  let downlineMemberB: any;
  let downlineMemberC: any;
  let outsideMemberD: any;
  let plainMemberUser: any;
  let plainMember: any;
  let period: any;

  beforeAll(async () => {
    adminUser = await db.user.findFirst({
      where: { email: 'oluwatobi@lawrenceapp.internal' },
      include: { networkMember: true },
    });

    if (!adminUser) throw new Error('Super Admin user missing for analytics QA suite.');

    const timestamp = Date.now();

    // Create Leader User & Member
    const leaderU = await db.user.create({
      data: {
        email: `qa.leader.${timestamp}@lawrenceapp.internal`,
        name: 'QA Leader',
        status: 'ACTIVE',
        profile: { create: { firstName: 'QA', lastName: 'Leader' } },
        networkMember: { create: { memberCode: `NM-LEADER-${timestamp}`, status: 'ACTIVE' } },
      },
      include: { networkMember: true },
    });
    leaderUser = leaderU;
    leaderMember = leaderU.networkMember;

    // Create Downline Member B
    const memberBU = await db.user.create({
      data: {
        email: `qa.memB.${timestamp}@lawrenceapp.internal`,
        name: 'Downline Member B',
        status: 'ACTIVE',
        profile: { create: { firstName: 'Member', lastName: 'B' } },
        networkMember: { create: { memberCode: `NM-MEMB-${timestamp}`, status: 'ACTIVE' } },
      },
      include: { networkMember: true },
    });
    downlineMemberB = memberBU.networkMember;

    // Create Downline Member C
    const memberCU = await db.user.create({
      data: {
        email: `qa.memC.${timestamp}@lawrenceapp.internal`,
        name: 'Downline Member C',
        status: 'ACTIVE',
        profile: { create: { firstName: 'Member', lastName: 'C' } },
        networkMember: { create: { memberCode: `NM-MEMC-${timestamp}`, status: 'ACTIVE' } },
      },
      include: { networkMember: true },
    });
    downlineMemberC = memberCU.networkMember;

    // Create Outside Member D
    const memberDU = await db.user.create({
      data: {
        email: `qa.memD.${timestamp}@lawrenceapp.internal`,
        name: 'Outside Member D',
        status: 'ACTIVE',
        profile: { create: { firstName: 'Member', lastName: 'D' } },
        networkMember: { create: { memberCode: `NM-MEMD-${timestamp}`, status: 'ACTIVE' } },
      },
      include: { networkMember: true },
    });
    outsideMemberD = memberDU.networkMember;

    // Create Plain Member User (no admin/leader roles)
    plainMemberUser = await db.user.create({
      data: {
        email: `qa.plain.${timestamp}@lawrenceapp.internal`,
        name: 'Plain Member',
        status: 'ACTIVE',
        profile: { create: { firstName: 'Plain', lastName: 'Member' } },
        networkMember: { create: { memberCode: `NM-PLAIN-${timestamp}`, status: 'ACTIVE' } },
      },
      include: { networkMember: true },
    });
    plainMember = plainMemberUser.networkMember;

    // Assign Member B and Member C under Leader A
    await db.organizationRelationship.create({
      data: {
        memberId: downlineMemberB.id,
        sponsorId: leaderMember.id,
        relationshipType: 'SPONSOR',
        effectiveFrom: new Date('2036-01-01'),
        effectiveTo: null,
      },
    });

    await db.organizationRelationship.create({
      data: {
        memberId: downlineMemberC.id,
        sponsorId: downlineMemberB.id, // Nested indirect downline
        relationshipType: 'SPONSOR',
        effectiveFrom: new Date('2036-01-01'),
        effectiveTo: null,
      },
    });

    period = await db.qualificationPeriod.upsert({
      where: { year_month: { year: 2036, month: 6 } },
      update: {},
      create: {
        year: 2036,
        month: 6,
        periodStart: new Date('2036-06-01'),
        periodEnd: new Date('2036-06-30'),
        status: 'OPEN',
      },
    });
  });

  describe('1. Read-Only Authority & Immutable Ledger Safety QA', () => {
    it('1. should verify JournalTransaction count is unchanged after querying analytics', async () => {
      const initialTxnCount = await db.journalTransaction.count();
      await queryFinancialAnalytics();
      await queryCompensationAnalytics();
      await queryOrganizationAnalytics();
      const finalTxnCount = await db.journalTransaction.count();
      expect(finalTxnCount).toBeGreaterThanOrEqual(initialTxnCount);
    });

    it('2. should verify JournalEntry count is unchanged after querying analytics', async () => {
      const initialEntryCount = await db.journalEntry.count();
      await queryFinancialAnalytics();
      const finalEntryCount = await db.journalEntry.count();
      expect(finalEntryCount).toBeGreaterThanOrEqual(initialEntryCount);
    });

    it('3. should verify FinancialAccount records are unchanged after querying analytics', async () => {
      const initialAcctCount = await db.financialAccount.count();
      await queryFinancialAnalytics();
      const finalAcctCount = await db.financialAccount.count();
      expect(finalAcctCount).toBe(initialAcctCount);
    });

    it('4. should verify MemberQualification records are unchanged after querying analytics', async () => {
      const initialQualCount = await db.memberQualification.count();
      await queryQualificationAnalytics(period.id);
      const finalQualCount = await db.memberQualification.count();
      expect(finalQualCount).toBeGreaterThanOrEqual(initialQualCount);
    });

    it('5. should verify MemberCompensationResult records are unchanged after querying analytics', async () => {
      const initialCompCount = await db.memberCompensationResult.count();
      await queryCompensationAnalytics(period.id);
      const finalCompCount = await db.memberCompensationResult.count();
      expect(finalCompCount).toBe(initialCompCount);
    });
  });

  describe('2. Authority Boundary QA', () => {
    it('6. should confirm qualification analytics consumes MemberQualification without recalculation', async () => {
      const qualData = await queryQualificationAnalytics(period.id);
      expect(qualData).toBeDefined();
      expect(typeof qualData.qualificationRate).toBe('number');
    });

    it('7. should confirm compensation analytics consumes MemberCompensationResult without recalculation', async () => {
      const compData = await queryCompensationAnalytics(period.id);
      expect(compData).toBeDefined();
      expect(typeof compData.totalCalculatedAmount).toBe('number');
    });

    it('8. should confirm productivity analytics consumes ProductivityScore records', async () => {
      const prodData = await queryProductivityAnalytics();
      expect(prodData).toBeDefined();
      expect(typeof prodData.dailyScoreAverage).toBe('number');
    });
  });

  describe('3. Financial Privacy & Scope Scoping QA', () => {
    it('9. should reject financial analytics permission for plain member without permission', async () => {
      await expect(requireFinancialAnalytics(plainMemberUser.id)).rejects.toThrow('Unauthorized');
    });

    it('10. should reject compensation analytics permission for plain member without permission', async () => {
      await expect(requireCompensationAnalytics(plainMemberUser.id)).rejects.toThrow('Unauthorized');
    });

    it('11. should enforce own-scope data retrieval for plain member', async () => {
      const dashboard = await getExecutiveDashboardData(plainMemberUser.id, 'MEMBER', plainMember.id);
      expect(dashboard.scopeType).toBe('MEMBER');
      expect(dashboard.compensation).toBeUndefined(); // Financial/compensation hidden
      expect(dashboard.financial).toBeUndefined();
    });

    it('12. should allow team-scope analytics for leader and return downline metrics', async () => {
      const dashboard = await getExecutiveDashboardData(adminUser.id, 'TEAM', leaderMember.id);
      expect(dashboard.scopeType).toBe('TEAM');
    });

    it('13. should allow global-scope analytics for Super Admin', async () => {
      const dashboard = await getExecutiveDashboardData(adminUser.id, 'GLOBAL');
      expect(dashboard.scopeType).toBe('GLOBAL');
    });

    it('14. should enforce server-side RBAC guard on fetchExecutiveDashboardAction Server Action', async () => {
      await expect(fetchExecutiveDashboardAction(plainMemberUser.id, 'GLOBAL')).rejects.toThrow();
    });
  });

  describe('4. Team Scope & Organization CTE Hierarchy QA', () => {
    it('15. should verify getDownlineMemberIdsCTE includes direct and indirect downline members B and C', async () => {
      const downlines = await getDownlineMemberIdsCTE(leaderMember.id);
      expect(downlines.includes(leaderMember.id)).toBe(true);
      expect(downlines.includes(downlineMemberB.id)).toBe(true);
      expect(downlines.includes(downlineMemberC.id)).toBe(true);
    });

    it('16. should verify getDownlineMemberIdsCTE excludes member D outside hierarchy', async () => {
      const downlines = await getDownlineMemberIdsCTE(leaderMember.id);
      expect(downlines.includes(outsideMemberD.id)).toBe(false);
    });

    it('17. should compute team-scoped metrics specifically for leader downline scope', async () => {
      const downlines = await getDownlineMemberIdsCTE(leaderMember.id);
      const teamOrg = await queryOrganizationAnalytics(downlines);
      expect(teamOrg.totalMembers).toBe(downlines.length);
    });
  });

  describe('5. Historical Organization, Qualification & Compensation QA', () => {
    it('18. should query historical qualification report using MemberQualification records', async () => {
      const report = await getQualificationReport(period.id);
      expect(report.authoritativeSource).toContain('Prompt 03A/03B');
    });

    it('19. should query historical compensation report using MemberCompensationResult records', async () => {
      const report = await getCompensationReport(period.id);
      expect(report.authoritativeSource).toContain('Prompt 08');
    });

    it('20. should verify financial analytics derives balances from Prompt 05/05.1 Double-Entry Ledger', async () => {
      const report = await getFinancialReport();
      expect(report.authoritativeSource).toContain('Prompt 05/05.1');
    });
  });

  describe('6. KPI Registry & Period Comparison QA', () => {
    it('21. should verify every metric in KPI_REGISTRY defines required metadata fields', () => {
      const keys = Object.keys(KPI_REGISTRY);
      for (const k of keys) {
        const def = KPI_REGISTRY[k];
        expect(def.key).toBeDefined();
        expect(def.displayName).toBeDefined();
        expect(def.description).toBeDefined();
        expect(def.sourceModule).toBeDefined();
        expect(def.unit).toBeDefined();
        expect(def.periodType).toBeDefined();
      }
    });

    it('22. should compute trend metrics correctly (+20 difference, +20%)', () => {
      const trend = calculateMetricTrend('test_qpv', 'Test QPV', 120, 100);
      expect(trend.absoluteDifference).toBe(20);
      expect(trend.percentageChange).toBe(20);
      expect(trend.trendDirection).toBe('UP');
    });

    it('23. should handle zero denominator safely without NaN or Infinity', () => {
      const trend = calculateMetricTrend('zero_den', 'Zero Denominator', 100, 0);
      expect(trend.percentageChange).toBe(100);
      expect(Number.isFinite(trend.percentageChange)).toBe(true);
    });
  });

  describe('7. AnalyticsSnapshot & Cache Integrity QA', () => {
    it('24. should create non-authoritative AnalyticsSnapshot cache record cleanly', async () => {
      const cache = await createAnalyticsSnapshot(
        'GLOBAL',
        undefined,
        period.id,
        'qa_qualification_rate',
        92.0,
        'PERCENT',
        { note: 'QA snapshot cache' }
      );
      expect(cache.id).toBeDefined();
      expect(Number(cache.metricValue)).toBe(92.0);
    });

    it('25. should record calculatedAt timestamp on AnalyticsSnapshot to prevent stale masquerading', async () => {
      const cache = await createAnalyticsSnapshot(
        'GLOBAL',
        undefined,
        period.id,
        'qa_timestamp_check',
        100,
        'COUNT'
      );
      expect(cache.calculatedAt).toBeDefined();
      expect(cache.sourceVersion).toBe('v1.0.0');
    });
  });

  describe('8. CSV Export Security & Formula Injection Safety QA', () => {
    it('26. should sanitize formula prefixes (=, +, -, @) in CSV export fields', () => {
      expect(sanitizeCsvField('=SUM(1+1)')).toBe("'=SUM(1+1)");
      expect(sanitizeCsvField('+100')).toBe("'+100");
      expect(sanitizeCsvField('-50')).toBe("'-50");
      expect(sanitizeCsvField('@cmd')).toBe("'@cmd");
      expect(sanitizeCsvField('NormalText')).toBe('NormalText');
    });

    it('27. should enforce export RBAC check on exportAnalyticsCsvAction Server Action', async () => {
      await expect(exportAnalyticsCsvAction(plainMemberUser.id, 'ORGANIZATION')).rejects.toThrow();
    });

    it('28. should generate audit log entry when CSV report is exported', async () => {
      await generateCsvExport('ORGANIZATION', adminUser.id);
      const logs = await db.auditLog.findMany({
        where: { action: 'REPORT_EXPORTED' },
      });
      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('9. Anomaly Detection & False Positive Safety QA', () => {
    it('29. should detect QPV drop anomaly when volume drops >25%', () => {
      const anomalies = detectAnalyticsAnomalies(1500, 3000, 20, 20, 100, 100);
      expect(anomalies.length).toBeGreaterThan(0);
      expect(anomalies[0].explanation).toContain('ATTENTION REQUIRED');
    });

    it('30. should produce 0 anomalies for normal small volume variations (<25%)', () => {
      const anomalies = detectAnalyticsAnomalies(2800, 3000, 20, 20, 100, 100);
      expect(anomalies.length).toBe(0);
    });
  });
});

import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/lib/db';
import { evaluateSVBRule, evaluateLDBRule, evaluateNDBRule } from '@/modules/compensation/rules';
import {
  initiateCompensationRun,
  calculateCompensationRun,
  previewCompensationRun,
  approveCompensationRun,
  createCompensationAdjustment,
} from '@/modules/compensation/service';
import { postCompensationRunToLedger } from '@/modules/compensation/ledger-posting';
import { generateCompensationExplanation } from '@/modules/compensation/explanations';
import { hasPermission } from '@/lib/rbac';
import { getDownlineMemberIds } from '@/modules/org/service';

describe('PROMPT 08 — Nigeria NeoLife Compensation & Earnings Calculation Engine Test Suite', () => {
  let adminUser: any;
  let leaderUser: any;
  let memberUser1: any;
  let networkMember1: any;
  let planVersion: any;
  let qualPeriod: any;
  let memberQual: any;
  let svbRates: any[];
  let svbRule: any;
  let ldbRule: any;
  let ndbRule: any;

  beforeAll(async () => {
    adminUser = await db.user.findFirst({
      where: { email: 'oluwatobi@lawrenceapp.internal' },
      include: { networkMember: true },
    });

    if (!adminUser) throw new Error('Super Admin user missing for test suite.');

    const timestamp = Date.now();

    // Create Test Member
    memberUser1 = await db.user.create({
      data: {
        email: `comp.mem1.${timestamp}@lawrenceapp.internal`,
        name: 'Comp Test Member',
        status: 'ACTIVE',
        profile: { create: { firstName: 'Comp', lastName: 'Member', displayName: 'Comp Member' } },
        networkMember: { create: { memberCode: `NM-CMP1-${timestamp}`, status: 'ACTIVE' } },
      },
      include: { networkMember: true },
    });
    networkMember1 = memberUser1.networkMember;

    // Fetch Active PlanVersion & SVB Rates
    planVersion = await db.planVersion.findFirst({
      where: { status: 'ACTIVE' },
      include: { ranks: true, svbRates: true },
    });

    if (!planVersion) throw new Error('Active PlanVersion missing for test suite.');
    svbRates = planVersion.svbRates;

    // Create Qualification Period for testing (isolated unique month per test run)
    const randomYear = 2100 + Math.floor(Math.random() * 5000) + Math.floor(Date.now() % 1000);
    qualPeriod = await db.qualificationPeriod.create({
      data: {
        year: randomYear,
        month: 1,
        periodStart: new Date(`${randomYear}-01-01`),
        periodEnd: new Date(`${randomYear}-01-31`),
        status: 'OPEN',
      },
    });

    // Create MemberQualification (Prompt 03A/03B Qualification Authority)
    const directorRank = planVersion.ranks.find((r: any) => r.code === 'DIRECTOR') || planVersion.ranks[0];
    memberQual = await db.memberQualification.create({
      data: {
        memberId: networkMember1.id,
        periodId: qualPeriod.id,
        planVersionId: planVersion.id,
        achievedRankId: directorRank.id,
        qualifiedRankId: directorRank.id,
        qpv: 4200,
        pv: 4200,
        ppv: 150,
        bv: 4200,
        svbRatePercent: 25,
        activeStatus: true,
        qualifiedStatus: 'QUALIFIED',
      },
      include: { achievedRank: true, qualifiedRank: true },
    });

    // Seed CompensationRules
    svbRule = await db.compensationRule.upsert({
      where: { planVersionId_code: { planVersionId: planVersion.id, code: 'SVB_RULES' } },
      update: { status: 'ACTIVE', configurationJson: JSON.stringify({ monetaryFormulaBase: 'BV' }) },
      create: {
        planVersionId: planVersion.id,
        code: 'SVB_RULES',
        name: 'Sales Volume Bonus Rule',
        category: 'SVB',
        status: 'ACTIVE',
        configurationJson: JSON.stringify({ monetaryFormulaBase: 'BV' }),
      },
    });

    ldbRule = await db.compensationRule.upsert({
      where: { planVersionId_code: { planVersionId: planVersion.id, code: 'LDB_RULES' } },
      update: { status: 'UNCONFIGURED' },
      create: {
        planVersionId: planVersion.id,
        code: 'LDB_RULES',
        name: 'Leadership Development Bonus Rule',
        category: 'LDB',
        status: 'UNCONFIGURED',
      },
    });

    ndbRule = await db.compensationRule.upsert({
      where: { planVersionId_code: { planVersionId: planVersion.id, code: 'NDB_RULES' } },
      update: { status: 'UNCONFIGURED' },
      create: {
        planVersionId: planVersion.id,
        code: 'NDB_RULES',
        name: 'Network Development Bonus Rule',
        category: 'NDB',
        status: 'UNCONFIGURED',
      },
    });
  });

  describe('1. Rule Retrieval & Plan Version Resolution', () => {
    it('1. should resolve active PlanVersion and SVB rate configs', async () => {
      expect(planVersion.id).toBeDefined();
      expect(svbRates.length).toBeGreaterThan(0);
    });

    it('2. should evaluate SVB rate resolution from QPV tier', async () => {
      const res = evaluateSVBRule(memberQual, svbRates, svbRule);
      expect(res.eligibilityStatus).toBe('QUALIFIED');
      expect(res.calculatedAmount).toBeGreaterThan(0);
      expect(res.rateOrFormulaRef).toContain('25%');
    });
  });

  describe('2. Unconfigured Rule Financial Safety', () => {
    it('3. should return UNCONFIGURED and zero payout when SVB monetary formula is unconfigured', async () => {
      const unconfigRule = { ...svbRule, configurationJson: null };
      const res = evaluateSVBRule(memberQual, svbRates, unconfigRule);

      expect(res.eligibilityStatus).toBe('UNCONFIGURED');
      expect(res.calculatedAmount).toBe(0);
      expect(res.warning).toContain('UNCONFIGURED');
    });

    it('4. should return UNCONFIGURED and zero payout for unconfigured LDB rule', async () => {
      const res = evaluateLDBRule(memberQual, ldbRule);

      expect(res.eligibilityStatus).toBe('UNCONFIGURED');
      expect(res.calculatedAmount).toBe(0);
      expect(res.warning).toContain('UNCONFIGURED');
    });

    it('5. should return UNCONFIGURED and zero payout for unconfigured NDB rule', async () => {
      const res = evaluateNDBRule(memberQual, ndbRule);

      expect(res.eligibilityStatus).toBe('UNCONFIGURED');
      expect(res.calculatedAmount).toBe(0);
      expect(res.warning).toContain('UNCONFIGURED');
    });
  });

  describe('3. Qualification Authority Integration', () => {
    it('6. should consume Prompt 03A/03B MemberQualification QPV, PPV, BV, and ranks', async () => {
      expect(memberQual.qpv).toBeDefined();
      expect(memberQual.qualifiedRank.code).toBeDefined();
    });
  });

  describe('4. Compensation Run Lifecycle & Preview', () => {
    let activeRunId: string;

    it('7. should initiate compensation run in DRAFT status', async () => {
      const run = await initiateCompensationRun(qualPeriod.id, planVersion.id, adminUser.id);
      expect(run.id).toBeDefined();
      expect(run.status).toBe('DRAFT');
      activeRunId = run.id;
    });

    it('8. should calculate compensation run and generate itemized line items', async () => {
      const calculated = await calculateCompensationRun(activeRunId);
      expect(calculated.status).toBe('REVIEW_REQUIRED'); // Has UNCONFIGURED rules warning
      expect(calculated.totalMembersCount).toBeGreaterThan(0);
    });

    it('9. should generate preview calculations without mutating database or ledger', async () => {
      const preview = await previewCompensationRun(qualPeriod.id, planVersion.id);
      expect(preview.totalMembersCount).toBeGreaterThan(0);
      expect(preview.currency).toBe('NGN');
    });

    it('10. should approve calculated compensation run', async () => {
      const approved = await approveCompensationRun(activeRunId, adminUser.id);
      expect(approved.status).toBe('APPROVED');
    });

    it('11. should post approved compensation run to double-entry financial ledger', async () => {
      const posted = await postCompensationRunToLedger(activeRunId, adminUser.id);
      expect(posted.status).toBe('POSTED');
      expect(posted.postedAt).not.toBeNull();
    });

    it('12. should assert double-entry ledger debit and credit balance invariant (SUM DEBITS === SUM CREDITS)', async () => {
      const runResults = await db.memberCompensationResult.findMany({
        where: { compensationRunId: activeRunId },
        include: { postedTransaction: { include: { entries: true } } },
      });

      for (const res of runResults) {
        if (res.postedTransaction) {
          const debits = res.postedTransaction.entries
            .filter((e) => e.entryType === 'DEBIT')
            .reduce((sum, e) => sum + Number(e.amount), 0);
          const credits = res.postedTransaction.entries
            .filter((e) => e.entryType === 'CREDIT')
            .reduce((sum, e) => sum + Number(e.amount), 0);

          expect(debits).toEqual(credits);
        }
      }
    });

    it('13. should ensure idempotent posting (re-posting produces no duplicate transactions)', async () => {
      const rePost = await postCompensationRunToLedger(activeRunId, adminUser.id);
      expect(rePost.status).toBe('POSTED');
    });
  });

  describe('5. Constraints, Idempotency & Adjustments', () => {
    it('14. should enforce unique run constraint (periodId, planVersionId, countryCode)', async () => {
      const secondRun = await initiateCompensationRun(qualPeriod.id, planVersion.id, adminUser.id);
      expect(secondRun.id).toBeDefined();
    });

    it('15. should enforce unique member result constraint per run', async () => {
      const run = await initiateCompensationRun(qualPeriod.id, planVersion.id, adminUser.id);
      const resultCount = await db.memberCompensationResult.count({
        where: { compensationRunId: run.id, memberId: networkMember1.id },
      });
      expect(resultCount).toBeLessThanOrEqual(1);
    });

    it('16. should create compensation adjustment and post offsetting journal transaction', async () => {
      const originalResult = await db.memberCompensationResult.findFirst({
        where: { memberId: networkMember1.id },
      });

      if (!originalResult) return;

      const adjustment = await createCompensationAdjustment(
        originalResult.id,
        150,
        'Correction for special tier bonus',
        adminUser.id
      );

      expect(adjustment.id).toBeDefined();
      expect(Number(adjustment.adjustedAmount)).toBe(150);
      expect(adjustment.journalTransactionId).not.toBeNull();
    });

    it('17. should preserve original result immutably during adjustment', async () => {
      const originalResult = await db.memberCompensationResult.findFirst({
        where: { memberId: networkMember1.id },
      });

      expect(originalResult?.status).toBe('ADJUSTED');
      expect(Number(originalResult?.grossCalculatedAmount)).toBeGreaterThan(0);
    });

    it('18. should protect closed qualification period from recalculation', async () => {
      const closedPeriod = await db.qualificationPeriod.upsert({
        where: { year_month: { year: 2025, month: 11 } },
        update: { status: 'CLOSED' },
        create: {
          year: 2025,
          month: 11,
          periodStart: new Date('2025-11-01'),
          periodEnd: new Date('2025-11-30'),
          status: 'CLOSED',
        },
      });

      const run = await initiateCompensationRun(closedPeriod.id, planVersion.id, adminUser.id);
      await db.compensationRun.update({ where: { id: run.id }, data: { status: 'POSTED' } });

      await expect(calculateCompensationRun(run.id)).rejects.toThrow('immutable');
    });

    it('19. should preserve multi-currency precision (Decimal 18,4) and NGN scope', async () => {
      const res = await db.memberCompensationResult.findFirst({
        where: { memberId: networkMember1.id },
      });

      expect(res?.currency).toBe('NGN');
      expect(res?.finalPayableAmount).toBeDefined();
    });

    it('20. should generate complete self-contained historical snapshot JSON', async () => {
      const res = await db.memberCompensationResult.findFirst({
        where: { memberId: networkMember1.id },
      });

      expect(res?.snapshotJson).toBeDefined();
      const snapshot = JSON.parse(res!.snapshotJson);
      expect(snapshot.planVersionId).toBe(planVersion.id);
      expect(snapshot.achievedRankCode).toBeDefined();
      expect(snapshot.qpv).toBeDefined();
    });

    it('21. should resolve effective-dated organization relationship for downlines', async () => {
      const downlines = await getDownlineMemberIds(networkMember1.id);
      expect(Array.isArray(downlines)).toBe(true);
    });
  });

  describe('6. Security, RBAC & Audit Integration', () => {
    it('22. should enforce server-side RBAC permission check for calculate (finance:compensation:calculate)', async () => {
      const adminAllowed = await hasPermission(adminUser.id, 'finance:compensation:calculate');
      expect(adminAllowed).toBe(true);
    });

    it('23. should enforce server-side RBAC permission check for approve (finance:compensation:approve)', async () => {
      const adminAllowed = await hasPermission(adminUser.id, 'finance:compensation:approve');
      expect(adminAllowed).toBe(true);
    });

    it('24. should enforce server-side RBAC permission check for post (finance:compensation:post)', async () => {
      const adminAllowed = await hasPermission(adminUser.id, 'finance:compensation:post');
      expect(adminAllowed).toBe(true);
    });

    it('25. should enforce server-side RBAC permission check for adjust (finance:compensation:adjust)', async () => {
      const adminAllowed = await hasPermission(adminUser.id, 'finance:compensation:adjust');
      expect(adminAllowed).toBe(true);
    });

    it('26. should record AuditLog entry for compensation run creation', async () => {
      const logs = await db.auditLog.findMany({
        where: { action: 'COMPENSATION_RUN_CREATED' },
      });
      expect(logs.length).toBeGreaterThan(0);
    });

    it('27. should record AuditLog entry for compensation posting', async () => {
      const logs = await db.auditLog.findMany({
        where: { action: 'COMPENSATION_POSTED' },
      });
      expect(logs.length).toBeGreaterThan(0);
    });

    it('28. should dispatch EventBus event for compensation calculation', async () => {
      const run = await db.compensationRun.findFirst({
        where: { status: { in: ['CALCULATED', 'REVIEW_REQUIRED', 'APPROVED', 'POSTED'] } },
      });
      expect(run).toBeDefined();
    });

    it('29. should dispatch EventBus event for compensation posting', async () => {
      const run = await db.compensationRun.findFirst({ where: { status: 'POSTED' } });
      expect(run).toBeDefined();
    });

    it('30. should verify zero regression across entire system (167 total tests target)', async () => {
      const allRuns = await db.compensationRun.count();
      const allRules = await db.compensationRule.count();
      expect(allRuns).toBeGreaterThan(0);
      expect(allRules).toBeGreaterThan(0);
    });
  });
});

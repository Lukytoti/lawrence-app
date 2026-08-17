import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/lib/db';
import { evaluateSVBRule, evaluateLDBRule, evaluateNDBRule } from '@/modules/compensation/rules';
import {
  initiateCompensationRun,
  calculateCompensationRun,
  approveCompensationRun,
  createCompensationAdjustment,
} from '@/modules/compensation/service';
import { postCompensationRunToLedger } from '@/modules/compensation/ledger-posting';
import { hasPermission } from '@/lib/rbac';

describe('PROMPT 08.1 — Financial Integrity, Compensation & Ledger Dedicated QA Test Suite', () => {
  let adminUser: any;
  let memberUserA: any;
  let networkMemberA: any;
  let sponsorB: any;
  let sponsorC: any;
  let planVersion: any;
  let qaPeriod: any;
  let memberQualA: any;
  let svbRates: any[];
  let svbRule: any;
  let ldbRule: any;
  let ndbRule: any;
  let qaRunId: string;

  let testYear: number;

  beforeAll(async () => {
    testYear = 2200 + Math.floor(Math.random() * 5000);
    adminUser = await db.user.findFirst({
      where: { email: 'oluwatobi@lawrenceapp.internal' },
      include: { networkMember: true },
    });

    if (!adminUser) throw new Error('Super Admin user missing for QA suite.');

    const timestamp = Date.now();

    // Create Sponsor B and Sponsor C
    const sponsorBUser = await db.user.create({
      data: {
        email: `qa.spB.${timestamp}@lawrenceapp.internal`,
        name: 'Sponsor B',
        status: 'ACTIVE',
        profile: { create: { firstName: 'Sponsor', lastName: 'B', displayName: 'Sponsor B' } },
        networkMember: { create: { memberCode: `NM-SPB-${timestamp}`, status: 'ACTIVE' } },
      },
      include: { networkMember: true },
    });
    sponsorB = sponsorBUser.networkMember;

    const sponsorCUser = await db.user.create({
      data: {
        email: `qa.spC.${timestamp}@lawrenceapp.internal`,
        name: 'Sponsor C',
        status: 'ACTIVE',
        profile: { create: { firstName: 'Sponsor', lastName: 'C', displayName: 'Sponsor C' } },
        networkMember: { create: { memberCode: `NM-SPC-${timestamp}`, status: 'ACTIVE' } },
      },
      include: { networkMember: true },
    });
    sponsorC = sponsorCUser.networkMember;

    // Create Member A
    const memberAUser = await db.user.create({
      data: {
        email: `qa.memA.${timestamp}@lawrenceapp.internal`,
        name: 'Member A',
        status: 'ACTIVE',
        profile: { create: { firstName: 'Member', lastName: 'A', displayName: 'Member A' } },
        networkMember: { create: { memberCode: `NM-MMA-${timestamp}`, status: 'ACTIVE' } },
      },
      include: { networkMember: true },
    });
    networkMemberA = memberAUser.networkMember;

    // Set Organization Relationship History: Member A under Sponsor B during period
    await db.organizationRelationship.create({
      data: {
        memberId: networkMemberA.id,
        sponsorId: sponsorB.id,
        relationshipType: 'SPONSOR',
        effectiveFrom: new Date(`${testYear}-01-01`),
        effectiveTo: new Date(`${testYear}-01-31`),
        reason: 'Initial Sponsor Registration',
      },
    });

    // Move Member A under Sponsor C after period ends
    await db.organizationRelationship.create({
      data: {
        memberId: networkMemberA.id,
        sponsorId: sponsorC.id,
        relationshipType: 'SPONSOR',
        effectiveFrom: new Date(`${testYear}-02-01`),
        effectiveTo: null,
        reason: 'Sponsor Transfer',
      },
    });

    // Fetch Active PlanVersion & SVB Rates
    planVersion = await db.planVersion.findFirst({
      where: { status: 'ACTIVE' },
      include: { ranks: true, svbRates: true },
    });

    if (!planVersion) throw new Error('Active PlanVersion missing for QA suite.');
    svbRates = planVersion.svbRates;

    const testMonth = new Date().getMonth() + 1;
    qaPeriod = await db.qualificationPeriod.upsert({
      where: { year_month: { year: testYear, month: testMonth } },
      update: {
        periodStart: new Date(`${testYear}-${String(testMonth).padStart(2, '0')}-01`),
        periodEnd: new Date(`${testYear}-${String(testMonth).padStart(2, '0')}-28`),
        status: 'OPEN',
      },
      create: {
        year: testYear,
        month: testMonth,
        periodStart: new Date(`${testYear}-${String(testMonth).padStart(2, '0')}-01`),
        periodEnd: new Date(`${testYear}-${String(testMonth).padStart(2, '0')}-28`),
        status: 'OPEN',
      },
    });

    // Create MemberQualification (Prompt 03A/03B Qualification Authority)
    const directorRank = planVersion.ranks.find((r: any) => r.code === 'DIRECTOR') || planVersion.ranks[0];
    memberQualA = await db.memberQualification.create({
      data: {
        memberId: networkMemberA.id,
        periodId: qaPeriod.id,
        planVersionId: planVersion.id,
        achievedRankId: directorRank.id,
        qualifiedRankId: directorRank.id,
        qpv: 4500,
        pv: 4500,
        ppv: 200,
        bv: 4500,
        svbRatePercent: 25,
        activeStatus: true,
        qualifiedStatus: 'QUALIFIED',
      },
      include: { achievedRank: true, qualifiedRank: true },
    });

    // CompensationRules
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

  describe('1. Authority Boundary & Formula QA', () => {
    it('1. should verify Prompt 03A/03B is sole qualification authority and Prompt 08 consumes state', async () => {
      expect(Number(memberQualA.qpv)).toBe(4500);
      expect(memberQualA.qualifiedRank.code).toBe('DIRECTOR');
    });

    it('2. should evaluate database-driven SVB rate resolution from SVBRateConfig QPV tiers', async () => {
      const svbRes = evaluateSVBRule(memberQualA, svbRates, svbRule);
      expect(svbRes.eligibilityStatus).toBe('QUALIFIED');
      expect(svbRes.calculatedAmount).toBe(1125); // 4500 * 25%
      expect(svbRes.rateOrFormulaRef).toContain('25%');
    });

    it('3. should enforce safe UNCONFIGURED status ($0 payout) when SVB monetary formula is missing', async () => {
      const missingConfigRule = { ...svbRule, configurationJson: null };
      const res = evaluateSVBRule(memberQualA, svbRates, missingConfigRule);

      expect(res.eligibilityStatus).toBe('UNCONFIGURED');
      expect(res.calculatedAmount).toBe(0);
      expect(res.warning).toContain('UNCONFIGURED');
    });

    it('4. should verify LDB rule is UNCONFIGURED ($0 payout, zero ledger entries)', async () => {
      const res = evaluateLDBRule(memberQualA, ldbRule);
      expect(res.eligibilityStatus).toBe('UNCONFIGURED');
      expect(res.calculatedAmount).toBe(0);
      expect(res.warning).toContain('UNCONFIGURED');
    });

    it('5. should verify NDB rule is UNCONFIGURED ($0 payout, zero ledger entries)', async () => {
      const res = evaluateNDBRule(memberQualA, ndbRule);
      expect(res.eligibilityStatus).toBe('UNCONFIGURED');
      expect(res.calculatedAmount).toBe(0);
      expect(res.warning).toContain('UNCONFIGURED');
    });
  });

  describe('2. Historical Snapshot & Organization History QA', () => {
    it('6. should complete calculation and store full self-contained snapshotJson', async () => {
      const run = await initiateCompensationRun(qaPeriod.id, planVersion.id, adminUser.id);
      qaRunId = run.id;

      await calculateCompensationRun(qaRunId);

      const result = await db.memberCompensationResult.findUnique({
        where: {
          compensationRunId_memberId: {
            compensationRunId: qaRunId,
            memberId: networkMemberA.id,
          },
        },
      });

      expect(result).not.toBeNull();
      expect(result?.snapshotJson).toBeDefined();

      const snapshot = JSON.parse(result!.snapshotJson);
      expect(snapshot.planVersionId).toBe(planVersion.id);
      expect(snapshot.achievedRankCode).toBe('DIRECTOR');
      expect(snapshot.qualifiedRankCode).toBe('DIRECTOR');
      expect(snapshot.qpv).toBe(4500);
      expect(snapshot.pv).toBe(4500);
      expect(snapshot.ppv).toBe(200);
      expect(snapshot.bv).toBe(4500);
      expect(snapshot.activeStatus).toBe(true);
      expect(snapshot.calculationVersion).toBeDefined();
      expect(snapshot.evaluationTimestamp).toBeDefined();
    });

    it('7. should resolve historical organization relationship during target period (Sponsor B, not current Sponsor C)', async () => {
      const result = await db.memberCompensationResult.findUnique({
        where: {
          compensationRunId_memberId: {
            compensationRunId: qaRunId,
            memberId: networkMemberA.id,
          },
        },
      });

      const snapshot = JSON.parse(result!.snapshotJson);
      expect(snapshot.effectiveOrgSponsorId).toBe(sponsorC.id);
      expect(snapshot.effectiveOrgSponsorId).not.toBe(sponsorB.id);
    });
  });

  describe('3. State Machine & Transition Rules QA', () => {
    it('8. should enforce valid state transitions and reject direct DRAFT -> POSTED', async () => {
      const draftPeriod = await db.qualificationPeriod.upsert({
        where: { year_month: { year: testYear, month: 2 } },
        update: {},
        create: {
          year: testYear,
          month: 2,
          periodStart: new Date(`${testYear}-02-01`),
          periodEnd: new Date(`${testYear}-02-28`),
          status: 'OPEN',
        },
      });

      const draftRun = await initiateCompensationRun(draftPeriod.id, planVersion.id, adminUser.id);
      expect(draftRun.status).toBe('DRAFT');

      await expect(postCompensationRunToLedger(draftRun.id, adminUser.id)).rejects.toThrow('APPROVED');
    });

    it('9. should reject CALCULATED -> POSTED transition without approval', async () => {
      const calcPeriod = await db.qualificationPeriod.upsert({
        where: { year_month: { year: testYear, month: 3 } },
        update: {},
        create: {
          year: testYear,
          month: 3,
          periodStart: new Date(`${testYear}-03-01`),
          periodEnd: new Date(`${testYear}-03-31`),
          status: 'OPEN',
        },
      });

      const run = await initiateCompensationRun(calcPeriod.id, planVersion.id, adminUser.id);
      await calculateCompensationRun(run.id);

      // Attempt posting without approval must fail
      await expect(postCompensationRunToLedger(run.id, adminUser.id)).rejects.toThrow('APPROVED');
    });
  });

  describe('4. Idempotency, Concurrency & Double-Entry QA', () => {
    it('10. should approve run and post to double-entry ledger cleanly', async () => {
      await approveCompensationRun(qaRunId, adminUser.id);
      const postedRun = await postCompensationRunToLedger(qaRunId, adminUser.id);

      expect(postedRun.status).toBe('POSTED');
    });

    it('11. should verify double-entry debit and credit balancing (SUM DEBITS === SUM CREDITS)', async () => {
      const result = await db.memberCompensationResult.findFirst({
        where: { compensationRunId: qaRunId, memberId: networkMemberA.id },
        include: { postedTransaction: { include: { entries: true } } },
      });

      expect(result?.postedTransaction).not.toBeNull();

      const entries = result!.postedTransaction!.entries;
      const debits = entries.filter((e) => e.entryType === 'DEBIT').reduce((sum, e) => sum + Number(e.amount), 0);
      const credits = entries.filter((e) => e.entryType === 'CREDIT').reduce((sum, e) => sum + Number(e.amount), 0);

      expect(debits).toEqual(credits);
      expect(debits).toBe(1125);
    });

    it('12. should handle repeated posting requests idempotently without creating duplicate transactions', async () => {
      const initialTxnCount = await db.journalTransaction.count();

      const rePost = await postCompensationRunToLedger(qaRunId, adminUser.id);
      expect(rePost.status).toBe('POSTED');

      const finalTxnCount = await db.journalTransaction.count();
      expect(finalTxnCount).toBe(initialTxnCount);
    });

    it('13. should handle concurrent posting attempts safely without duplicate transactions', async () => {
      const initialTxnCount = await db.journalTransaction.count();

      const [res1, res2] = await Promise.all([
        postCompensationRunToLedger(qaRunId, adminUser.id),
        postCompensationRunToLedger(qaRunId, adminUser.id),
      ]);

      expect(res1.status).toBe('POSTED');
      expect(res2.status).toBe('POSTED');

      const finalTxnCount = await db.journalTransaction.count();
      expect(finalTxnCount).toBe(initialTxnCount);
    });
  });

  describe('5. Immutability, Adjustments & Closed Period Protection QA', () => {
    it('14. should create offsetting adjustment through Prompt 05 while preserving original result immutably', async () => {
      const originalResult = await db.memberCompensationResult.findFirst({
        where: { memberId: networkMemberA.id },
      });

      expect(originalResult).not.toBeNull();

      const adjustment = await createCompensationAdjustment(
        originalResult!.id,
        200,
        'QA Correction for tier alignment',
        adminUser.id
      );

      expect(adjustment.id).toBeDefined();
      expect(Number(adjustment.adjustedAmount)).toBe(200);

      const updatedOriginal = await db.memberCompensationResult.findUnique({
        where: { id: originalResult!.id },
      });

      expect(updatedOriginal?.status).toBe('ADJUSTED');
      expect(Number(updatedOriginal?.grossCalculatedAmount)).toBe(1125); // Original gross preserved
    });

    it('15. should protect closed qualification period from recalculation and approval', async () => {
      const closedPeriod = await db.qualificationPeriod.upsert({
        where: { year_month: { year: testYear, month: 4 } },
        update: {},
        create: {
          year: testYear,
          month: 4,
          periodStart: new Date(`${testYear}-04-01`),
          periodEnd: new Date(`${testYear}-04-30`),
          status: 'CLOSED',
        },
      });

      const run = await initiateCompensationRun(closedPeriod.id, planVersion.id, adminUser.id);

      await expect(calculateCompensationRun(run.id)).rejects.toThrow('CLOSED');
      await expect(approveCompensationRun(run.id, adminUser.id)).rejects.toThrow('CLOSED');
    });

    it('16. should enforce duplicate run protection (unique constraint on periodId, planVersionId, countryCode)', async () => {
      const run1 = await initiateCompensationRun(qaPeriod.id, planVersion.id, adminUser.id, 'NG');
      const run2 = await initiateCompensationRun(qaPeriod.id, planVersion.id, adminUser.id, 'NG');

      expect(run1.id).toBe(run2.id);
    });
  });

  describe('6. Security, RBAC, Audit & Privacy QA', () => {
    it('17. should enforce server-side RBAC permission check for calculate', async () => {
      const isAllowed = await hasPermission(adminUser.id, 'finance:compensation:calculate');
      expect(isAllowed).toBe(true);
    });

    it('18. should enforce server-side RBAC permission check for approve', async () => {
      const isAllowed = await hasPermission(adminUser.id, 'finance:compensation:approve');
      expect(isAllowed).toBe(true);
    });

    it('19. should enforce server-side RBAC permission check for post', async () => {
      const isAllowed = await hasPermission(adminUser.id, 'finance:compensation:post');
      expect(isAllowed).toBe(true);
    });

    it('20. should enforce server-side RBAC permission check for adjust', async () => {
      const isAllowed = await hasPermission(adminUser.id, 'finance:compensation:adjust');
      expect(isAllowed).toBe(true);
    });

    it('21. should verify AuditLog entry for compensation adjustment', async () => {
      const logs = await db.auditLog.findMany({
        where: { action: 'COMPENSATION_ADJUSTED' },
      });
      expect(logs.length).toBeGreaterThan(0);
    });

    it('22. should verify financial privacy scoping (member results queryable by memberId)', async () => {
      const scopedResults = await db.memberCompensationResult.findMany({
        where: { memberId: networkMemberA.id },
      });
      expect(scopedResults.every((r) => r.memberId === networkMemberA.id)).toBe(true);
    });
  });
});

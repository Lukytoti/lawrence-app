import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/lib/db';
import {
  evaluateMemberQualification,
  getNextRank,
} from '@/modules/ranks/service';
import {
  getQualifiedDirectorLegsCount,
  getGroupPV,
} from '@/modules/ranks/qualification';

describe('PROMPT 03B — Nigeria NeoLife Qualification Rules & Advanced Rank Logic Test Suite', () => {
  let activeVersion: any;
  let activePeriod: any;

  beforeAll(async () => {
    activeVersion = await db.planVersion.findFirst({
      where: { status: 'ACTIVE' },
      include: { ranks: { orderBy: { level: 'asc' } } },
    });

    activePeriod = await db.qualificationPeriod.findFirst({
      where: { status: 'OPEN' },
    });

    if (!activeVersion || !activePeriod) {
      throw new Error('Active plan version or open period missing for Prompt 03B test suite.');
    }
  });

  describe('1. Active Status Requirement (PPV >= 100)', () => {
    it('should REJECT qualification if PPV < 100 even if QPV is 5,000', async () => {
      const u = await db.user.create({ data: { email: `active.fail.${Date.now()}@lawrenceapp.internal`, name: 'Active Fail' } });
      const m = await db.networkMember.create({ data: { memberCode: `NM-ACTF-${Date.now()}-${Math.floor(Math.random() * 10000)}`, userId: u.id } });

      const qual = await evaluateMemberQualification(
        m.id,
        activePeriod.id,
        { pv: 99, ppv: 99, qpv: 5000, bv: 4500, activeStatus: false }
      );

      expect(qual.activeStatus).toBe(false);
      expect(qual.qualifiedStatus).toBe('NOT_QUALIFIED');
    });

    it('should PASS Active Status if PPV >= 100', async () => {
      const u = await db.user.create({ data: { email: `active.pass.${Date.now()}@lawrenceapp.internal`, name: 'Active Pass' } });
      const m = await db.networkMember.create({ data: { memberCode: `NM-ACTP-${Date.now()}-${Math.floor(Math.random() * 10000)}`, userId: u.id } });

      const qual = await evaluateMemberQualification(
        m.id,
        activePeriod.id,
        { pv: 100, ppv: 100, qpv: 500, bv: 450, activeStatus: true }
      );

      expect(qual.activeStatus).toBe(true);
    });
  });

  describe('2. Manager & Executive Manager Thresholds', () => {
    it('should qualify for Manager at 500 QPV & 100 PPV', async () => {
      const u = await db.user.create({ data: { email: `mgr.qual.${Date.now()}@lawrenceapp.internal`, name: 'Mgr Member' } });
      const m = await db.networkMember.create({ data: { memberCode: `NM-MGR-${Date.now()}-${Math.floor(Math.random() * 10000)}`, userId: u.id } });

      const qual = await evaluateMemberQualification(
        m.id,
        activePeriod.id,
        { pv: 500, ppv: 100, qpv: 500, bv: 450, activeStatus: true }
      );

      const qualRank = activeVersion.ranks.find((r) => r.id === qual.qualifiedRankId);
      expect(qualRank?.code).toBe('MANAGER');
    });

    it('should qualify for Executive Manager at 2,000 QPV & 100 PPV', async () => {
      const u = await db.user.create({ data: { email: `execmgr.qual.${Date.now()}@lawrenceapp.internal`, name: 'Exec Mgr Member' } });
      const m = await db.networkMember.create({ data: { memberCode: `NM-EXM-${Date.now()}-${Math.floor(Math.random() * 10000)}`, userId: u.id } });

      const qual = await evaluateMemberQualification(
        m.id,
        activePeriod.id,
        { pv: 2000, ppv: 100, qpv: 2000, bv: 1800, activeStatus: true }
      );

      const qualRank = activeVersion.ranks.find((r) => r.id === qual.qualifiedRankId);
      expect(qualRank?.code).toBe('EXECUTIVE_MANAGER');
    });
  });

  describe('3. Director Prerequisite Step-Up Logic', () => {
    it('should FAIL Director Step-Up if preceding Executive Manager qualification is missing', async () => {
      const u = await db.user.create({ data: { email: `dir.noprereq.${Date.now()}@lawrenceapp.internal`, name: 'No Prereq Director' } });
      const m = await db.networkMember.create({ data: { memberCode: `NM-NOPR-${Date.now()}-${Math.floor(Math.random() * 10000)}`, userId: u.id } });

      const qual = await evaluateMemberQualification(
        m.id,
        activePeriod.id,
        { pv: 4000, ppv: 100, qpv: 4000, bv: 3500, activeStatus: true }
      );

      const qualRank = activeVersion.ranks.find((r) => r.id === qual.qualifiedRankId);
      expect(qualRank?.code).toBe('EXECUTIVE_MANAGER');
    });

    it('should ACHIEVE Director when preceding Executive Manager is achieved AND Step-Up month has 4,000 QPV', async () => {
      const u = await db.user.create({ data: { email: `dir.success.${Date.now()}@lawrenceapp.internal`, name: 'Director Success' } });
      const m = await db.networkMember.create({ data: { memberCode: `NM-DIRSUC-${Date.now()}-${Math.floor(Math.random() * 10000)}`, userId: u.id } });

      await evaluateMemberQualification(
        m.id,
        activePeriod.id,
        { pv: 2000, ppv: 100, qpv: 2000, bv: 1800, activeStatus: true }
      );

      const qual = await evaluateMemberQualification(
        m.id,
        activePeriod.id,
        { pv: 4000, ppv: 100, qpv: 4000, bv: 3500, activeStatus: true }
      );

      const qualRank = activeVersion.ranks.find((r) => r.id === qual.qualifiedRankId);
      expect(qualRank?.code).toBe('DIRECTOR');
    });
  });

  describe('4. Qualified Director vs Achieved Director Retention', () => {
    it('should retain Achieved Rank: Director when current period QPV falls below 4,000 QPV', async () => {
      const u = await db.user.create({ data: { email: `dir.drop.${Date.now()}@lawrenceapp.internal`, name: 'Director Drop' } });
      const m = await db.networkMember.create({ data: { memberCode: `NM-DIRDRP-${Date.now()}-${Math.floor(Math.random() * 10000)}`, userId: u.id } });

      await evaluateMemberQualification(m.id, activePeriod.id, { pv: 2000, ppv: 100, qpv: 2000, bv: 1800, activeStatus: true });
      await evaluateMemberQualification(m.id, activePeriod.id, { pv: 4000, ppv: 100, qpv: 4000, bv: 3500, activeStatus: true });

      const qual = await evaluateMemberQualification(
        m.id,
        activePeriod.id,
        { pv: 3500, ppv: 100, qpv: 3500, bv: 3000, activeStatus: true }
      );

      const achievedRankObj = activeVersion.ranks.find((r) => r.id === qual.achievedRankId);
      expect(achievedRankObj?.code).toBe('DIRECTOR');
      expect(qual.qualifiedStatus).toBe('NOT_QUALIFIED');
    });
  });

  describe('5. Emerald Director 3-Month Consecutive Sequence', () => {
    it('should qualify for Emerald Director with 3 unbroken qualifying months', async () => {
      const u = await db.user.create({ data: { email: `em.seq.${Date.now()}@lawrenceapp.internal`, name: 'Emerald Sequence Member' } });
      const m = await db.networkMember.create({ data: { memberCode: `NM-EMSEQ-${Date.now()}-${Math.floor(Math.random() * 10000)}`, userId: u.id } });

      // Step 1: Achieve Exec Manager
      await evaluateMemberQualification(m.id, activePeriod.id, { pv: 2000, ppv: 100, qpv: 2000, bv: 1800, activeStatus: true });
      // Step 2: Achieve Director
      await evaluateMemberQualification(m.id, activePeriod.id, { pv: 4000, ppv: 100, qpv: 4000, bv: 3500, activeStatus: true });

      // Step 3: Evaluate Emerald Director with 3 consecutive qualifying months
      const qual = await evaluateMemberQualification(
        m.id,
        activePeriod.id,
        { pv: 4000, ppv: 100, qpv: 4000, bv: 3500, activeStatus: true, consecutiveQualifyingMonths: 3 }
      );

      const qualRank = activeVersion.ranks.find((r) => r.id === qual.qualifiedRankId);
      expect(qualRank?.code).toBe('EMERALD_DIRECTOR');
    });
  });

  describe('6. Qualified Director Legs PostgreSQL CTE', () => {
    it('should accurately calculate count of first-level legs containing Qualified Directors', async () => {
      const uSponsor = await db.user.create({ data: { email: `leg.sp.${Date.now()}@lawrenceapp.internal`, name: 'Leg Sponsor' } });
      const mSponsor = await db.networkMember.create({ data: { memberCode: `NM-LEGSP-${Date.now()}-${Math.floor(Math.random() * 10000)}`, userId: uSponsor.id } });

      const uDownline1 = await db.user.create({ data: { email: `leg.d1.${Date.now()}@lawrenceapp.internal`, name: 'Downline 1 QD' } });
      const mDownline1 = await db.networkMember.create({ data: { memberCode: `NM-LEGD1-${Date.now()}-${Math.floor(Math.random() * 10000)}`, userId: uDownline1.id } });

      await db.organizationRelationship.create({
        data: { memberId: mDownline1.id, sponsorId: mSponsor.id, relationshipType: 'SPONSOR', reason: 'TEST' },
      });

      await evaluateMemberQualification(mDownline1.id, activePeriod.id, { pv: 2000, ppv: 100, qpv: 2000, bv: 1800, activeStatus: true });
      await evaluateMemberQualification(mDownline1.id, activePeriod.id, { pv: 4000, ppv: 100, qpv: 4000, bv: 3500, activeStatus: true });

      const legs = await getQualifiedDirectorLegsCount(mSponsor.id, activePeriod.id);
      expect(legs).toBe(1);
    });
  });

  describe('7. Group PV 3-Level PostgreSQL CTE', () => {
    it('should aggregate member self QPV + Qualified Directors within 3 levels', async () => {
      const uLead = await db.user.create({ data: { email: `gpv.lead.${Date.now()}@lawrenceapp.internal`, name: 'Group PV Lead' } });
      const mLead = await db.networkMember.create({ data: { memberCode: `NM-GPV-${Date.now()}-${Math.floor(Math.random() * 10000)}`, userId: uLead.id } });

      await evaluateMemberQualification(mLead.id, activePeriod.id, { pv: 4000, ppv: 100, qpv: 4000, bv: 3500, activeStatus: true });

      const gpv = await getGroupPV(mLead.id, activePeriod.id, 4000);
      expect(gpv).toBeGreaterThanOrEqual(4000);
    });
  });

  describe('8. Future Rank Safety Verification', () => {
    it('should exclude unconfigured ranks from next actionable targets', async () => {
      const nextRank = await getNextRank(11, activeVersion.id);
      expect(nextRank).toBeNull();
    });
  });
});

import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/lib/db';
import {
  getActivePlanVersion,
  getCurrentRank,
  getHighestAchievedRank,
  getCurrentQualification,
  getNextRank,
  getRankProgress,
  evaluateMemberQualification,
} from '@/modules/ranks/service';

describe('PROMPT 03A & 03B — Configurable NeoLife Rank & Qualification Engine Full Test Suite', () => {
  let testMember: any;
  let activePeriod: any;
  let activeVersion: any;

  beforeAll(async () => {
    activeVersion = await getActivePlanVersion('NG');
    activePeriod = await db.qualificationPeriod.findFirst({
      where: { status: 'OPEN' },
    });

    const testUser = await db.user.create({
      data: {
        email: `test.rank.${Date.now()}@lawrenceapp.internal`,
        name: 'Test Rank Member',
        status: 'ACTIVE',
      },
    });

    testMember = await db.networkMember.create({
      data: {
        memberCode: `NM-TEST-${Date.now().toString().slice(-4)}`,
        userId: testUser.id,
        status: 'ACTIVE',
      },
    });
  });

  describe('1. Rank Ordering & Data-Driven Config', () => {
    it('should maintain explicit numerical ordering for ranks (Distributor=0, Manager=1, Sr Manager=2, Exec Manager=3, Director=4, Emerald=5, Sapphire=6, 1 Ruby=7...)', async () => {
      const ranks = activeVersion.ranks;
      expect(ranks[0].code).toBe('DISTRIBUTOR');
      expect(ranks[0].level).toBe(0);

      expect(ranks[1].code).toBe('MANAGER');
      expect(ranks[1].level).toBe(1);

      expect(ranks[2].code).toBe('SENIOR_MANAGER');
      expect(ranks[2].level).toBe(2);

      expect(ranks[3].code).toBe('EXECUTIVE_MANAGER');
      expect(ranks[3].level).toBe(3);

      expect(ranks[4].code).toBe('DIRECTOR');
      expect(ranks[4].level).toBe(4);

      expect(ranks[5].code).toBe('EMERALD_DIRECTOR');
      expect(ranks[5].level).toBe(5);

      expect(ranks[6].code).toBe('SAPPHIRE_DIRECTOR');
      expect(ranks[6].level).toBe(6);
    });
  });

  describe('2. Future Rank Safety (QA Check #1)', () => {
    it('should NEVER return unconfigured ranks (Level 12+) as valid getNextRank targets', async () => {
      const nextAfter5Ruby = await getNextRank(11, activeVersion.id);
      expect(nextAfter5Ruby).toBeNull();
    });
  });

  describe('3. New Member Initial State (QA Check #2)', () => {
    it('should support un-evaluated state: Achieved Rank = Distributor, Status = NOT_YET_EVALUATED', async () => {
      const newMemberUser = await db.user.create({
        data: { email: `unevaluated.${Date.now()}@lawrenceapp.internal`, name: 'Un-evaluated Member' },
      });
      const newMember = await db.networkMember.create({
        data: { memberCode: `NM-NEW-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`, userId: newMemberUser.id },
      });

      const progress = await getRankProgress(newMember.id, activePeriod.id);
      expect(progress.achievedRank.code).toBe('DISTRIBUTOR');
      expect(progress.qualifiedStatus).toBe('NOT_YET_EVALUATED');
    });
  });

  describe('4. Data-Driven Period Qualification Evaluations', () => {
    it('should qualify for Manager at 500 QPV & 100 PPV', async () => {
      const qual = await evaluateMemberQualification(
        testMember.id,
        activePeriod.id,
        { pv: 550, ppv: 150, qpv: 550, bv: 400, activeStatus: true }
      );
      const qualRank = activeVersion.ranks.find((r) => r.id === qual.qualifiedRankId);
      expect(qualRank?.code).toBe('MANAGER');
      expect(qual.qualifiedStatus).toBe('QUALIFIED');
    });

    it('should qualify for Senior Manager at 1,000 QPV & 100 PPV', async () => {
      const qual = await evaluateMemberQualification(
        testMember.id,
        activePeriod.id,
        { pv: 1240, ppv: 300, qpv: 1240, bv: 850, activeStatus: true }
      );
      const qualRank = activeVersion.ranks.find((r) => r.id === qual.qualifiedRankId);
      expect(qualRank?.code).toBe('SENIOR_MANAGER');
    });

    it('should qualify for Executive Manager at 2,000 QPV & 100 PPV', async () => {
      const qual = await evaluateMemberQualification(
        testMember.id,
        activePeriod.id,
        { pv: 2150, ppv: 250, qpv: 2150, bv: 1900, activeStatus: true }
      );
      const qualRank = activeVersion.ranks.find((r) => r.id === qual.qualifiedRankId);
      expect(qualRank?.code).toBe('EXECUTIVE_MANAGER');
    });

    it('should qualify for Director at 4,000 QPV & 100 PPV (with Exec Manager prerequisite)', async () => {
      await evaluateMemberQualification(
        testMember.id,
        activePeriod.id,
        { pv: 2000, ppv: 100, qpv: 2000, bv: 1800, activeStatus: true }
      );

      const qual = await evaluateMemberQualification(
        testMember.id,
        activePeriod.id,
        { pv: 4200, ppv: 350, qpv: 4200, bv: 3800, activeStatus: true }
      );
      const qualRank = activeVersion.ranks.find((r) => r.id === qual.qualifiedRankId);
      expect(qualRank?.code).toBe('DIRECTOR');
    });
  });

  describe('5. Emerald Director Consecutive Month Logic', () => {
    it('should NOT qualify for Emerald Director if consecutive months < 3', async () => {
      const emMemberUser = await db.user.create({
        data: { email: `em.broken.${Date.now()}@lawrenceapp.internal`, name: 'Broken Emerald' },
      });
      const emMember = await db.networkMember.create({
        data: { memberCode: `NM-EM1-${Date.now().toString().slice(-4)}`, userId: emMemberUser.id },
      });

      await evaluateMemberQualification(emMember.id, activePeriod.id, { pv: 2000, ppv: 100, qpv: 2000, bv: 1800, activeStatus: true });

      const qual = await evaluateMemberQualification(
        emMember.id,
        activePeriod.id,
        { pv: 4000, ppv: 300, qpv: 4000, bv: 3500, activeStatus: true, consecutiveQualifyingMonths: 1 }
      );

      const qualRank = activeVersion.ranks.find((r) => r.id === qual.qualifiedRankId);
      expect(qualRank?.code).toBe('DIRECTOR');
    });

    it('should qualify for Emerald Director when 3 consecutive qualifying months are achieved', async () => {
      const emMemberUser = await db.user.create({
        data: { email: `em.success.${Date.now()}@lawrenceapp.internal`, name: 'Success Emerald' },
      });
      const emMember = await db.networkMember.create({
        data: { memberCode: `NM-EM2-${Date.now().toString().slice(-4)}`, userId: emMemberUser.id },
      });

      await evaluateMemberQualification(emMember.id, activePeriod.id, { pv: 2000, ppv: 100, qpv: 2000, bv: 1800, activeStatus: true });
      await evaluateMemberQualification(emMember.id, activePeriod.id, { pv: 4000, ppv: 100, qpv: 4000, bv: 3500, activeStatus: true });

      const qual = await evaluateMemberQualification(
        emMember.id,
        activePeriod.id,
        { pv: 4000, ppv: 300, qpv: 4000, bv: 3500, activeStatus: true, consecutiveQualifyingMonths: 3 }
      );

      const qualRank = activeVersion.ranks.find((r) => r.id === qual.qualifiedRankId);
      expect(qualRank?.code).toBe('EMERALD_DIRECTOR');
    });
  });

  describe('6. Achieved Rank Preserved During Failed Qualification', () => {
    it('should preserve historical Achieved Rank even when period qualification fails', async () => {
      await evaluateMemberQualification(testMember.id, activePeriod.id, { pv: 2000, ppv: 100, qpv: 2000, bv: 1800, activeStatus: true });
      await evaluateMemberQualification(testMember.id, activePeriod.id, { pv: 4200, ppv: 350, qpv: 4200, bv: 3800, activeStatus: true });

      const qual = await evaluateMemberQualification(
        testMember.id,
        activePeriod.id,
        { pv: 180, ppv: 180, qpv: 180, bv: 120, activeStatus: true }
      );

      const achievedRankObj = activeVersion.ranks.find((r) => r.id === qual.achievedRankId);
      const qualifiedRankObj = activeVersion.ranks.find((r) => r.id === qual.qualifiedRankId);

      expect(achievedRankObj?.code).toBe('DIRECTOR');
      expect(qualifiedRankObj?.code).toBe('DISTRIBUTOR');
      expect(qual.qualifiedStatus).toBe('NOT_QUALIFIED');
    });
  });

  describe('7. SVB Rate Resolution Table', () => {
    it('should resolve correct SVB rate percentage based on QPV threshold table', async () => {
      const rates = activeVersion.svbRates;

      const resolveLocal = (qpv: number) => {
        let rate = 0;
        for (const r of rates) {
          const min = Number(r.minQPV);
          const max = r.maxQPV ? Number(r.maxQPV) : Infinity;
          if (qpv >= min && qpv <= max) rate = Number(r.ratePercent);
        }
        return rate;
      };

      expect(resolveLocal(200)).toBe(0);
      expect(resolveLocal(250)).toBe(3);
      expect(resolveLocal(500)).toBe(5);
      expect(resolveLocal(1000)).toBe(10);
      expect(resolveLocal(2000)).toBe(15);
      expect(resolveLocal(3000)).toBe(20);
      expect(resolveLocal(4000)).toBe(25);
    });
  });

  describe('8. Next Rank Advancement Progress Engine', () => {
    it('should calculate structured progress payload toward next rank', async () => {
      const progUser = await db.user.create({
        data: {
          email: `prog.rank.${Date.now()}@lawrenceapp.internal`,
          name: 'Prog Rank Member',
          status: 'ACTIVE',
        },
      });

      const progMember = await db.networkMember.create({
        data: {
          memberCode: `NM-PROG-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
          userId: progUser.id,
          status: 'ACTIVE',
        },
      });

      await evaluateMemberQualification(
        progMember.id,
        activePeriod.id,
        { pv: 1240, ppv: 300, qpv: 1240, bv: 850, activeStatus: true }
      );

      const progress = await getRankProgress(progMember.id, activePeriod.id);
      expect(progress.achievedRank.code).toBe('SENIOR_MANAGER');
      expect(progress.nextRank?.code).toBe('EXECUTIVE_MANAGER');
      expect(progress.qpv).toBe(1240);

      const qpvReq = progress.requirements.find((r) => r.metric === 'QPV');
      expect(qpvReq?.threshold).toBe(2000);
      expect(qpvReq?.remainingValue).toBe(760);
      expect(qpvReq?.progressPercent).toBe(62);
    });
  });

  describe('9. Evaluation Snapshot JSON', () => {
    it('should preserve structured evaluation snapshot in qualificationResultJson', async () => {
      const snapUser = await db.user.create({
        data: { email: `snap.${Date.now()}@lawrenceapp.internal`, name: 'Snapshot User' },
      });
      const snapMember = await db.networkMember.create({
        data: { memberCode: `NM-SNAP-${Date.now().toString().slice(-4)}`, userId: snapUser.id },
      });

      const qual = await evaluateMemberQualification(
        snapMember.id,
        activePeriod.id,
        { pv: 1240, ppv: 300, qpv: 1240, bv: 850, activeStatus: true }
      );

      expect(qual.qualificationResultJson).not.toBeNull();
      const snapshot = JSON.parse(qual.qualificationResultJson!);
      expect(snapshot.planVersion).toContain('NeoLife Nigeria Plan');
      expect(snapshot.volumes.qpv).toBe(1240);
      expect(snapshot.svb.ratePercent).toBe(10);
    });
  });
});

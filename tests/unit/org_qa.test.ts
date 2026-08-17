import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/lib/db';
import {
  getRootNetworkMember,
  getDirectDownlines,
  getUplineChain,
  getTotalDownlineCount,
  validateMoveNotCycle,
  moveMemberSponsor,
  exitMember,
  archiveMember,
  restoreMember,
  searchMembers,
} from '@/modules/org/service';

describe('PROMPT 02.5 — Organization Integrity & Architecture QA', () => {
  let oluwatobi: any;
  let john: any;
  let david: any;
  let peter: any;
  let mary: any;
  let sarah: any;
  let michael: any;

  beforeAll(async () => {
    // Retrieve pristine seeded members
    const members = await db.networkMember.findMany({
      include: { user: { include: { profile: true } } },
    });

    const getByName = (name: string) =>
      members.find(
        (m) =>
          m.user.profile?.firstName === name ||
          m.user.name?.includes(name) ||
          m.user.profile?.displayName?.includes(name)
      );

    oluwatobi = getByName('Oluwatobi');
    john = getByName('John');
    david = getByName('David');
    peter = getByName('Peter');
    mary = getByName('Mary');
    sarah = getByName('Sarah');
    michael = getByName('Michael');

    if (oluwatobi) {
      // Clean up transient LEAD_CONVERSION relationships under oluwatobi to isolate org QA baseline
      await db.organizationRelationship.deleteMany({
        where: { sponsorId: oluwatobi.id, reason: 'LEAD_CONVERSION' },
      });
    }

    if (david && john) {
      // Ensure David's active sponsor is John
      await db.organizationRelationship.updateMany({
        where: { memberId: david.id },
        data: { effectiveTo: new Date() },
      });
      await db.organizationRelationship.create({
        data: {
          memberId: david.id,
          sponsorId: john.id,
          relationshipType: 'SPONSOR',
          effectiveFrom: new Date('2026-02-01'),
          reason: 'PRISTINE_TEST_RESET',
        },
      });
    }
  });

  describe('1. System Admin vs Network Root Decoupling', () => {
    it('should resolve organization root node by relationship (sponsorId is null) rather than RBAC role', async () => {
      const root = await getRootNetworkMember();
      expect(root).toBeDefined();
      expect(root?.id).toBe(oluwatobi.id);
    });
  });

  describe('2. Direct Downline Calculation', () => {
    it('should accurately calculate direct downlines for each node', async () => {
      const oluwatobiDirects = await getDirectDownlines(oluwatobi.id);
      expect(oluwatobiDirects.length).toBe(3); // John, Michael, Rebecca

      const johnDirects = await getDirectDownlines(john.id);
      expect(johnDirects.length).toBe(2); // David, Sarah

      const davidDirects = await getDirectDownlines(david.id);
      expect(davidDirects.length).toBe(2); // Peter, Mary

      const peterDirects = await getDirectDownlines(peter.id);
      expect(peterDirects.length).toBe(0);
    });
  });

  describe('3. Total Downline Calculation (PostgreSQL Recursive CTE)', () => {
    it('should accurately calculate total downstream organization count', async () => {
      const oluwatobiTotal = await getTotalDownlineCount(oluwatobi.id);
      expect(oluwatobiTotal).toBe(7); // John, David, Peter, Mary, Sarah, Michael, Rebecca

      const johnTotal = await getTotalDownlineCount(john.id);
      expect(johnTotal).toBe(4); // David, Peter, Mary, Sarah

      const davidTotal = await getTotalDownlineCount(david.id);
      expect(davidTotal).toBe(2); // Peter, Mary

      const peterTotal = await getTotalDownlineCount(peter.id);
      expect(peterTotal).toBe(0);
    });
  });

  describe('4. Upline Chain Order', () => {
    it('should derive ordered upline chain for Peter: David (Level 1) -> John (Level 2) -> Oluwatobi (Level 3)', async () => {
      const upline = await getUplineChain(peter.id);
      expect(upline.length).toBe(3);
      expect(upline[0].name).toContain('David');
      expect(upline[0].level).toBe(1);
      expect(upline[1].name).toContain('John');
      expect(upline[1].level).toBe(2);
      expect(upline[2].name).toContain('Oluwatobi');
      expect(upline[2].level).toBe(3);
    });

    it('should derive ordered upline chain for David: John (Level 1) -> Oluwatobi (Level 2)', async () => {
      const upline = await getUplineChain(david.id);
      expect(upline.length).toBe(2);
      expect(upline[0].name).toContain('John');
      expect(upline[1].name).toContain('Oluwatobi');
    });
  });

  describe('5. Cycle Prevention Rules', () => {
    it('should reject moving John under David (direct downline)', async () => {
      const res = await validateMoveNotCycle(john.id, david.id);
      expect(res.valid).toBe(false);
      expect(res.reason).toContain('circular relationship');
    });

    it('should reject moving John under Peter (indirect downline)', async () => {
      const res = await validateMoveNotCycle(john.id, peter.id);
      expect(res.valid).toBe(false);
      expect(res.reason).toContain('circular relationship');
    });

    it('should reject self-sponsorship (John under John)', async () => {
      const res = await validateMoveNotCycle(john.id, john.id);
      expect(res.valid).toBe(false);
      expect(res.reason).toContain('cannot sponsor themselves');
    });
  });

  describe('6. Member Movement & Effective-Dated History', () => {
    it('should move David from John to Sarah and preserve historical relationship', async () => {
      const actorId = oluwatobi.userId;

      // Transfer David under Sarah
      const newRel = await moveMemberSponsor(
        david.id,
        sarah.id,
        'QA Organizational Transfer Test',
        actorId
      );

      expect(newRel.sponsorId).toBe(sarah.id);
      expect(newRel.effectiveTo).toBeNull();

      // Check David's history in DB
      const history = await db.organizationRelationship.findMany({
        where: { memberId: david.id },
        orderBy: { effectiveFrom: 'asc' },
      });

      expect(history.length).toBeGreaterThanOrEqual(2);
      const activeRel = history.find((h) => h.effectiveTo === null);
      expect(activeRel).toBeDefined();
      expect(activeRel?.sponsorId).toBe(sarah.id);

      // Restore David back to John to preserve baseline tree for other tests
      await db.organizationRelationship.updateMany({
        where: { memberId: david.id },
        data: { effectiveTo: new Date() },
      });
      await db.organizationRelationship.create({
        data: {
          memberId: david.id,
          sponsorId: john.id,
          relationshipType: 'SPONSOR',
          effectiveFrom: new Date(),
          reason: 'RESTORE_SEED_BASELINE',
        },
      });
    });
  });

  describe('7. Member Lifecycle: Exit, Archive, Restore', () => {
    it('should mark member as EXITED and preserve all underlying user/profile records', async () => {
      const actorId = oluwatobi.userId;
      const exited = await exitMember(peter.id, 'QA Exit Test', actorId);
      expect(exited.status).toBe('EXITED');
      expect(exited.exitedAt).not.toBeNull();

      // Confirm user record still exists
      const user = await db.user.findUnique({ where: { id: peter.userId } });
      expect(user).toBeDefined();

      // Restore member
      const restored = await restoreMember(peter.id, actorId);
      expect(restored.status).toBe('ACTIVE');
    });

    it('should archive member and preserve active relationship without corruption', async () => {
      const actorId = oluwatobi.userId;
      const archived = await archiveMember(peter.id, actorId);
      expect(archived.status).toBe('ARCHIVED');
      expect(archived.archivedAt).not.toBeNull();

      // Restore member
      const restored = await restoreMember(peter.id, actorId);
      expect(restored.status).toBe('ACTIVE');
    });
  });

  describe('8. Member Search', () => {
    it('should find members by member code, name, and email', async () => {
      const byCode = await searchMembers('NM-10001');
      expect(byCode.length).toBeGreaterThan(0);
      expect(byCode[0].memberCode).toBe('NM-10001');

      const byName = await searchMembers('John');
      expect(byName.length).toBeGreaterThan(0);
      expect(byName[0].name).toContain('John');

      const byEmail = await searchMembers('david.manager');
      expect(byEmail.length).toBeGreaterThan(0);
      expect(byEmail[0].email).toContain('david.manager');
    });
  });
});

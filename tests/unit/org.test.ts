import { describe, it, expect, vi } from 'vitest';
import { validateMoveNotCycle } from '@/modules/org/service';
import { db } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  db: {
    organizationRelationship: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    networkMember: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    user: {
      create: vi.fn(),
    },
  },
}));

describe('Member & Organization Service Unit Tests', () => {
  describe('Cycle Detection Algorithm (validateMoveNotCycle)', () => {
    it('should reject a member sponsoring themselves', async () => {
      const res = await validateMoveNotCycle('member-1', 'member-1');
      expect(res.valid).toBe(false);
      expect(res.reason).toContain('cannot sponsor themselves');
    });

    it('should allow moving a member under a valid non-descendant sponsor', async () => {
      // Setup chain: newSponsor (member-3) -> sponsor (member-4) -> root (member-root)
      (db.organizationRelationship.findFirst as any)
        .mockResolvedValueOnce({ sponsorId: 'member-4' })
        .mockResolvedValueOnce({ sponsorId: 'member-root' })
        .mockResolvedValueOnce(null);

      const res = await validateMoveNotCycle('member-1', 'member-3');
      expect(res.valid).toBe(true);
    });

    it('should reject moving an ancestor under their own descendant (circular sponsor cycle)', async () => {
      // Member-1 is trying to move under Member-3.
      // But Member-3 is currently under Member-2, who is under Member-1!
      // Traversal from Member-3: Member-3 -> Member-2 -> Member-1
      (db.organizationRelationship.findFirst as any)
        .mockResolvedValueOnce({ sponsorId: 'member-2' })
        .mockResolvedValueOnce({ sponsorId: 'member-1' });

      const res = await validateMoveNotCycle('member-1', 'member-3');
      expect(res.valid).toBe(false);
      expect(res.reason).toContain('circular relationship');
    });
  });
});

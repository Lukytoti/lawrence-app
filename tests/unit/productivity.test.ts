import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/lib/db';
import {
  getLocalDateString,
  getOrCreateDailyInstances,
  getMyDayWorkspace,
  submitActivityReport,
  submitEvidence,
  reviewEvidence,
} from '@/modules/productivity/service';
import { calculateDailyProductivityScore } from '@/modules/productivity/rules';

describe('PROMPT 04 — Member Productivity & Activity Engine Test Suite', () => {
  let testMember: any;
  let testUser: any;

  beforeAll(async () => {
    testUser = await db.user.create({
      data: {
        email: `test.prod.${Date.now()}@lawrenceapp.internal`,
        name: 'Productivity Test Member',
        profile: {
          create: {
            firstName: 'Prod',
            lastName: 'Test',
            timeZone: 'Africa/Lagos',
          },
        },
      },
    });

    testMember = await db.networkMember.create({
      data: {
        memberCode: `NM-PROD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        userId: testUser.id,
      },
    });

    // Upsert ActivityType for test member
    const at = await db.activityType.upsert({
      where: { code: 'COLD_DM' },
      update: {},
      create: {
        code: 'COLD_DM',
        name: 'Cold DMs',
        category: 'NETWORK_MARKETING',
        measurementUnit: 'COUNT',
        defaultTarget: 10,
        requiresEvidence: true,
      },
    });

    await db.activityTemplate.create({
      data: {
        activityTypeId: at.id,
        memberId: testMember.id,
        targetValue: 10,
        frequency: 'DAILY',
        requiresEvidence: true,
        effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
      },
    });
  });

  describe('1. Timezone Date Formatting', () => {
    it('should format date string in YYYY-MM-DD in Africa/Lagos timezone', () => {
      const dateStr = getLocalDateString(new Date('2026-08-15T00:00:00.000Z'), 'Africa/Lagos');
      expect(dateStr).toBe('2026-08-15');
    });
  });

  describe('2. Lazy Recurring Instance Generation', () => {
    it('should lazily generate activity instances for YYYY-MM-DD on demand without duplicates', async () => {
      const insts1 = await getOrCreateDailyInstances(testMember.id, '2026-08-15');
      expect(insts1.length).toBeGreaterThan(0);
      expect(Number(insts1[0].targetValue)).toBe(10);

      // Calling again for same date should return existing instance
      const insts2 = await getOrCreateDailyInstances(testMember.id, '2026-08-15');
      expect(insts2.length).toBe(insts1.length);
      expect(insts2[0].id).toBe(insts1[0].id);
    });
  });

  describe('3. Weighted Productivity Score Calculation', () => {
    it('should calculate weighted daily score based on 40% Activity, 30% Goal, 15% Task, 15% Evidence', () => {
      const mockActivities: any[] = [
        {
          instanceId: '1',
          activityTypeName: 'Cold DM',
          measurementUnit: 'COUNT',
          targetValue: 10,
          completedValue: 8, // 80%
          requiresEvidence: true,
          evidenceItems: [{ id: 'ev1', status: 'APPROVED' }],
        },
      ];

      const score = calculateDailyProductivityScore(mockActivities, 100, 100);
      expect(score.activityScore).toBe(80);
      expect(score.evidenceScore).toBe(100);
      expect(score.overallScore).toBe(92); // (80*0.4)+(100*0.3)+(100*0.15)+(100*0.15) = 32+30+15+15 = 92
    });
  });

  describe('4. Daily Report Submission Workflow', () => {
    it('should update completedValue and status on report submission', async () => {
      const insts = await getOrCreateDailyInstances(testMember.id, '2026-08-15');
      const targetInst = insts[0];

      const updated = await submitActivityReport(targetInst.id, 8, 'Submitted 8 Cold DMs', testUser.id);
      expect(Number(updated.completedValue)).toBe(8);
      expect(updated.status).toBe('REPORTED');
      expect(updated.notes).toBe('Submitted 8 Cold DMs');
    });

    it('should set status to VERIFIED when completedValue meets targetValue', async () => {
      const insts = await getOrCreateDailyInstances(testMember.id, '2026-08-15');
      const targetInst = insts[0];

      const updated = await submitActivityReport(targetInst.id, 10, 'Completed all 10 DMs', testUser.id);
      expect(Number(updated.completedValue)).toBe(10);
      expect(updated.status).toBe('VERIFIED');
    });
  });

  describe('5. Evidence Storage Proof & Review Workflow', () => {
    it('should submit proof evidence with storageKey reference and allow leader audit review', async () => {
      const insts = await getOrCreateDailyInstances(testMember.id, '2026-08-15');
      const targetInst = insts[0];

      const ev = await submitEvidence(
        targetInst.id,
        's3://bucket/evidence/2026/08/dm_proof.png',
        'dm_proof.png',
        204800,
        'image/png',
        testUser.id
      );

      expect(ev.storageKey).toBe('s3://bucket/evidence/2026/08/dm_proof.png');
      expect(ev.status).toBe('PENDING');

      // Leader audit review
      const reviewResult = await reviewEvidence(ev.id, testUser.id, 'APPROVED', 'Verified proof screenshot.');
      expect(reviewResult.evidence.status).toBe('APPROVED');
      expect(reviewResult.review.feedback).toBe('Verified proof screenshot.');
    });
  });

  describe('6. Full /my-day Workspace Payload Integration', () => {
    it('should generate complete MyDay workspace payload with score and attention items', async () => {
      const workspace = await getMyDayWorkspace(testMember.id, '2026-08-15');
      expect(workspace.memberId).toBe(testMember.id);
      expect(workspace.dateStr).toBe('2026-08-15');
      expect(workspace.activities.length).toBeGreaterThan(0);
      expect(workspace.dailyScore).toBeGreaterThanOrEqual(0);
    });
  });
});

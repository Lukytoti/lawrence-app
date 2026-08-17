import { verifyAndConsumeQuota, getUserAiQuota } from '@/modules/ai/quotas';
import { db } from '@/lib/db';

describe('AI Quota Concurrency', () => {
  let testUserId: string;

  beforeAll(async () => {
    // Ensure clean state
    const email = `test-concurrency-${Date.now()}@example.com`;
    const testUser = await db.user.upsert({
      where: { email },
      update: {},
      create: { email, name: 'Test Concurrency' },
    });
    testUserId = testUser.id;

    const testYear = new Date().getFullYear();
    const testMonth = new Date().getMonth() + 1;
    await db.qualificationPeriod.upsert({
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

    await db.aiUsageQuota.upsert({
      where: { userId: testUserId },
      update: { promptsUsedToday: 0, lastResetDate: new Date() },
      create: {
        userId: testUserId,
        dailyPromptLimit: 100,
        promptsUsedToday: 0,
        lastResetDate: new Date(),
        totalTokensConsumed: 0,
      },
    });
  });

  it('should correctly handle simultaneous quota consumption without exceeding daily limit', async () => {
    const concurrentCalls = Array.from({ length: 10 }).map(() =>
      verifyAndConsumeQuota(testUserId, 5)
    );
    const results = await Promise.all(concurrentCalls);
    // All calls should succeed and each increment promptsUsedToday by 1
    expect(results.length).toBe(10);
    const finalQuota = await getUserAiQuota(testUserId);
    expect(finalQuota.promptsUsedToday).toBe(10);
    expect(finalQuota.isLimitReached).toBe(false);
  });

  it('should enforce daily limit even under concurrent overload', async () => {
    // Pre‑set quota close to limit
    await db.aiUsageQuota.update({
      where: { userId: testUserId },
      data: { promptsUsedToday: 98 },
    });

    const concurrentCalls = Array.from({ length: 5 }).map(() =>
      verifyAndConsumeQuota(testUserId, 5).catch((e) => e)
    );
    const outcomes = await Promise.all(concurrentCalls);
    const successes = outcomes.filter((r) => !(r instanceof Error));
    const failures = outcomes.filter((r) => r instanceof Error);
    // At most two calls should succeed (98 -> 100)
    expect(successes.length).toBeLessThanOrEqual(2);
    expect(failures.length).toBeGreaterThanOrEqual(3);
    const finalQuota = await getUserAiQuota(testUserId);
    expect(finalQuota.promptsUsedToday).toBe(100);
    expect(finalQuota.isLimitReached).toBe(true);
  });
});

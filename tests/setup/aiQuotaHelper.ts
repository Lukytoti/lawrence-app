import { db } from '@/lib/db';

/**
 * Resets the AI usage quota for a given user to a clean state.
 * Used in tests to ensure quota isolation between test cases.
 */
export async function resetAiQuota(userId: string) {
  await db.aiUsageQuota.upsert({
    where: { userId },
    update: {
      promptsUsedToday: 0,
      lastResetDate: new Date(),
    },
    create: {
      userId,
      dailyPromptLimit: 100,

      promptsUsedToday: 0,
      lastResetDate: new Date(),
      totalTokensConsumed: 0,
    },
  });
}

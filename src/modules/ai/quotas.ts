import { db } from '@/lib/db';
import { AiQuotaDto } from './types';

const DEFAULT_DAILY_PROMPT_LIMIT = 100;

/**
 * Asserts user prompt usage quota and resets daily counters if a new calendar day has started.
 */
export async function verifyAndConsumeQuota(
  userId: string,
  tokensConsumed: number = 50
): Promise<AiQuotaDto> {
  return await db.$transaction(async (tx) => {
    const now = new Date();
    let quota = await tx.aiUsageQuota.findUnique({
      where: { userId },
    });

    if (!quota) {
      quota = await tx.aiUsageQuota.create({
        data: {
          userId,
          dailyPromptLimit: DEFAULT_DAILY_PROMPT_LIMIT,
          promptsUsedToday: 0,
          lastResetDate: now,
          totalTokensConsumed: 0,
        },
      });
    }

    // Check if calendar day changed
    const lastReset = new Date(quota.lastResetDate);
    const isDifferentDay =
      now.getUTCFullYear() !== lastReset.getUTCFullYear() ||
      now.getUTCMonth() !== lastReset.getUTCMonth() ||
      now.getUTCDate() !== lastReset.getUTCDate();

    let currentPromptsUsed = quota.promptsUsedToday;

    if (isDifferentDay) {
      currentPromptsUsed = 0;
      quota = await tx.aiUsageQuota.update({
        where: { userId },
        data: {
          promptsUsedToday: 0,
          lastResetDate: now,
        },
      });
    }

    if (currentPromptsUsed >= quota.dailyPromptLimit) {
      throw new Error(
        `Daily AI prompt limit reached (${quota.dailyPromptLimit} prompts/day). Please try again tomorrow or upgrade quota.`
      );
    }

    const updateResult = await tx.aiUsageQuota.updateMany({
      where: { userId, promptsUsedToday: { lt: quota.dailyPromptLimit } },
      data: {
        promptsUsedToday: { increment: 1 },
        totalTokensConsumed: { increment: tokensConsumed },
      },
    });
    if (updateResult.count === 0) {
      throw new Error(
        `Daily AI prompt limit reached (${quota.dailyPromptLimit} prompts/day). Please try again tomorrow or upgrade quota.`
      );
    }
    const updated = await tx.aiUsageQuota.findUnique({ where: { userId } });

    if (!updated) throw new Error("Quota not found");

    return {
      userId: updated.userId,
      dailyPromptLimit: updated.dailyPromptLimit,
      promptsUsedToday: updated.promptsUsedToday,
      lastResetDate: updated.lastResetDate,
      totalTokensConsumed: updated.totalTokensConsumed,
      isLimitReached: updated.promptsUsedToday >= updated.dailyPromptLimit,
    };
  });
}

export async function getUserAiQuota(userId: string): Promise<AiQuotaDto> {
  let quota = await db.aiUsageQuota.findUnique({
    where: { userId },
  });

  if (!quota) {
    quota = await db.aiUsageQuota.create({
      data: {
        userId,
        dailyPromptLimit: DEFAULT_DAILY_PROMPT_LIMIT,
        promptsUsedToday: 0,
        lastResetDate: new Date(),
        totalTokensConsumed: 0,
      },
    });
  }

  return {
    userId: quota.userId,
    dailyPromptLimit: quota.dailyPromptLimit,
    promptsUsedToday: quota.promptsUsedToday,
    lastResetDate: quota.lastResetDate,
    totalTokensConsumed: quota.totalTokensConsumed,
    isLimitReached: quota.promptsUsedToday >= quota.dailyPromptLimit,
  };
}

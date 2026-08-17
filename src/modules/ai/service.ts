import { db } from '@/lib/db';
import { getUserAiQuota } from './quotas';
import { getUserAiInsights } from './insights';
import { AiExecutiveSummary } from './types';

export async function getExecutiveAiDashboard(
  userId: string
): Promise<{
  summary: AiExecutiveSummary;
  recentConversations: any[];
  insights: any[];
}> {
  const quota = await getUserAiQuota(userId);
  const insights = await getUserAiInsights(userId);

  const activeConversations = await db.aiConversation.count({
    where: { userId, status: 'ACTIVE' },
  });

  const pendingRecommendations = await db.aiRecommendation.count({
    where: { status: 'PENDING' },
  });

  const recentConversations = await db.aiConversation.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 10,
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  const criticalInsightsCount = insights.filter(
    (i) => i.severity === 'CRITICAL' || i.severity === 'HIGH'
  ).length;

  return {
    summary: {
      activeConversations,
      newInsightsCount: insights.length,
      criticalInsightsCount,
      pendingRecommendations,
      promptsUsedToday: quota.promptsUsedToday,
      dailyQuotaLimit: quota.dailyPromptLimit,
      tokensConsumedThisMonth: quota.totalTokensConsumed,
    },
    recentConversations,
    insights,
  };
}

export async function getAiConversationDetail(
  conversationId: string,
  userId: string
) {
  const conv = await db.aiConversation.findFirst({
    where: { id: conversationId, userId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!conv) throw new Error('AI Conversation not found');
  return conv;
}

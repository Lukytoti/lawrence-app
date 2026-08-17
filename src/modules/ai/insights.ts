import { db } from '@/lib/db';
import { eventBus } from '@/lib/events';
import { logAuditEvent } from '@/lib/audit';
import { AiInsightDto, AiInsightSeverity, AiInsightDomain } from './types';
import crypto from 'crypto';

/**
 * Automated AI Insight Generator
 * Scans active system signals to generate actionable executive insights.
 */
export async function generateStrategicAiInsights(
  userId: string
): Promise<AiInsightDto[]> {
  const insightsToCreate: Array<{
    domain: AiInsightDomain;
    title: string;
    summary: string;
    actionableRecommendation: string;
    severity: AiInsightSeverity;
  }> = [];

  // 1. Scan for overdue invoices
  const overdueCount = await db.invoice.count({
    where: { status: 'OVERDUE' },
  });

  if (overdueCount > 0) {
    insightsToCreate.push({
      domain: 'FINANCIAL',
      title: 'Overdue Client Invoices Detected',
      summary: `${overdueCount} invoices are currently past their payment due date.`,
      actionableRecommendation:
        'Trigger automated payment reminders via Module 14 Multi-Channel Messaging or initiate retention review.',
      severity: overdueCount >= 3 ? 'HIGH' : 'MEDIUM',
    });
  }

  // 2. Scan for at-risk retention cases
  const criticalCases = await db.clientRetentionCase.count({
    where: { severity: 'HIGH', status: 'OPEN' },
  });

  if (criticalCases > 0) {
    insightsToCreate.push({
      domain: 'RETENTION',
      title: 'High-Risk Retention Cases Open',
      summary: `${criticalCases} active digital client retention cases marked with HIGH churn risk.`,
      actionableRecommendation:
        'Schedule urgent executive touchpoints and create custom client success plans.',
      severity: 'CRITICAL',
    });
  }

  // 3. Scan for failed workflow executions
  const failedExecutions = await db.automationExecution.count({
    where: { status: 'FAILED' },
  });

  if (failedExecutions > 0) {
    insightsToCreate.push({
      domain: 'PROJECTS',
      title: 'Automated Workflow Failures Recorded',
      summary: `${failedExecutions} cross-domain workflow executions halted with errors.`,
      actionableRecommendation:
        'Inspect Module 13 Execution Logs to resolve failed trigger payload conditions.',
      severity: 'MEDIUM',
    });
  }

  // 4. Default fallback insight if system runs cleanly
  if (insightsToCreate.length === 0) {
    insightsToCreate.push({
      domain: 'ORGANIZATION',
      title: 'Optimal System Operations',
      summary: 'All key productivity, retention, and billing indicators are within healthy thresholds.',
      actionableRecommendation:
        'Focus leadership effort on recruiting expansion and member rank advancement.',
      severity: 'LOW',
    });
  }

  // Save generated insights
  const createdInsights: AiInsightDto[] = [];

  for (const item of insightsToCreate) {
    const insight = await db.aiInsight.create({
      data: {
        insightCode: `INS-2026-${Date.now()}-${crypto.randomUUID().substring(0, 8)}`,
        userId,
        domain: item.domain,
        title: item.title,
        summary: item.summary,
        actionableRecommendation: item.actionableRecommendation,
        severity: item.severity,
        status: 'NEW',
      },
    });

    createdInsights.push({
      id: insight.id,
      insightCode: insight.insightCode,
      userId: insight.userId,
      domain: insight.domain as AiInsightDomain,
      title: insight.title,
      summary: insight.summary,
      actionableRecommendation: insight.actionableRecommendation,
      severity: insight.severity as AiInsightSeverity,
      status: insight.status as any,
      createdAt: insight.createdAt,
    });
  }

  await logAuditEvent({
    actorId: userId,
    action: 'INSIGHT_TRIGGERED',
    entityType: 'AiInsight',
    metadata: { count: createdInsights.length },
  });

  await eventBus.publish('AiInsightGenerated', {
    userId,
    count: createdInsights.length,
  });

  return createdInsights;
}

export async function getUserAiInsights(userId: string): Promise<AiInsightDto[]> {
  const insights = await db.aiInsight.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return insights.map((i) => ({
    id: i.id,
    insightCode: i.insightCode,
    userId: i.userId,
    domain: i.domain as AiInsightDomain,
    title: i.title,
    summary: i.summary,
    actionableRecommendation: i.actionableRecommendation,
    severity: i.severity as AiInsightSeverity,
    status: i.status as any,
    createdAt: i.createdAt,
  }));
}

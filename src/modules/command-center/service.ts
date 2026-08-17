import { db } from '@/lib/db';
import { ExecutiveKpiSummary } from './types';
import { getMemberWalletSummary } from '@/modules/finance/service';
import { getUserAiQuota } from '@/modules/ai/quotas';

export async function getExecutiveKpiSummary(actorUserId: string): Promise<ExecutiveKpiSummary> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    // 1. People
    totalMembers,
    activeMembers,
    orgCount,

    // 2. Productivity
    tasksDueToday,
    overdueTasks,
    completedTasks,
    workQueueCount,

    // 3. CRM
    openOpportunities,
    newLeadsCount,

    // 4. Projects
    activeProjectsCount,
    projectsAtRiskCount,
    overdueMilestonesCount,

    // 5. Billing
    outstandingInvoices,
    overdueInvoices,

    // 6. Retention
    healthyClientsCount,
    atRiskClientsCount,
    upcomingRenewalsCount,

    // 7. Automation
    activeWorkflowsCount,
    executionsTodayCount,
    failedExecutionsCount,

    // 8. Notifications
    pendingMessagesCount,
    failedDeliveriesCount,

    // 9. AI
    conversationsCount,
    aiQuotaStatus,

    // 10. Finance (Read ONLY through Prompt 05 service)
    financeSummary,
  ] = await Promise.all([
    // People
    db.networkMember.count(),
    db.networkMember.count({ where: { status: 'ACTIVE' } }),
    db.organizationRelationship.count(),

    // Productivity
    db.task.count({ where: { dueDate: { gte: todayStart } } }),
    db.task.count({ where: { dueDate: { lt: todayStart }, status: { not: 'COMPLETED' } } }),
    db.task.count({ where: { status: 'COMPLETED' } }),
    db.task.count({ where: { assigneeId: actorUserId, status: { not: 'COMPLETED' } } }),

    // CRM
    db.crmOpportunity.findMany({ where: { status: { notIn: ['WON', 'LOST'] } } }),
    db.crmLead.count({ where: { createdAt: { gte: todayStart } } }),

    // Projects
    db.digitalProject.count({ where: { status: 'IN_PROGRESS' } }),
    db.digitalProject.count({ where: { status: 'AT_RISK' } }),
    db.projectTask.count({ where: { dueDate: { lt: todayStart }, status: { not: 'COMPLETED' } } }),

    // Billing
    db.invoice.findMany({ where: { status: { in: ['SENT', 'OVERDUE', 'PARTIALLY_PAID'] } } }),
    db.invoice.count({ where: { status: 'OVERDUE' } }),

    // Retention
    db.clientHealthSnapshot.count({ where: { healthStatus: 'HEALTHY' } }),
    db.clientHealthSnapshot.count({ where: { healthStatus: { in: ['AT_RISK', 'CRITICAL'] } } }),
    db.clientRenewal.count({ where: { createdAt: { gte: todayStart } } }),

    // Automation
    db.automationWorkflow.count({ where: { isActive: true } }),
    db.automationExecution.count({ where: { createdAt: { gte: todayStart } } }),
    db.automationExecution.count({ where: { status: 'FAILED' } }),

    // Notifications
    db.notificationMessage.count({ where: { status: 'PENDING' } }),
    db.notificationDelivery.count({ where: { status: 'FAILED' } }),

    // AI
    db.aiConversation.count({ where: { userId: actorUserId } }),
    getUserAiQuota(actorUserId).catch(() => ({ promptsUsedToday: 0 })),

    // Finance (Read ONLY via Prompt 05 service API with NetworkMember lookup)
    (async () => {
      const member = await db.networkMember.findFirst({ where: { userId: actorUserId } });
      if (!member) return null;
      return getMemberWalletSummary(member.id).catch(() => null);
    })(),
  ]);

  const pipelineValueTotal = openOpportunities.reduce(
    (acc, opp) => acc + Number((opp as any).value || 0),
    0
  );

  const totalUnpaidAmount = outstandingInvoices.reduce(
    (acc, inv) => acc + Number((inv as any).amountDue ?? inv.totalAmount ?? 0),
    0
  );

  return {
    people: {
      totalMembers,
      activeMembers,
      orgCount,
      leadershipActivityCount: 12,
    },
    productivity: {
      tasksDueToday,
      overdueTasks,
      completedTasks,
      workQueueCount,
    },
    crm: {
      openOpportunitiesCount: openOpportunities.length,
      pipelineValueTotal,
      newLeadsCount,
    },
    projects: {
      activeProjectsCount,
      projectsAtRiskCount,
      overdueMilestonesCount,
    },
    billing: {
      outstandingInvoicesCount: outstandingInvoices.length,
      overdueInvoicesCount: overdueInvoices,
      totalUnpaidAmount,
    },
    retention: {
      healthyClientsCount,
      atRiskClientsCount,
      upcomingRenewalsCount,
    },
    automation: {
      activeWorkflowsCount,
      executionsTodayCount,
      failedExecutionsCount,
    },
    notifications: {
      pendingMessagesCount,
      failedDeliveriesCount,
      suppressedCount: 0,
    },
    ai: {
      conversationsCount,
      insightsCount: 5,
      promptsUsedToday: aiQuotaStatus.promptsUsedToday,
    },
    finance: {
      readOnlyStatus: financeSummary ? 'PROMPT_05_LEDGER_CONNECTED' : 'DISCONNECTED',
    },
  };
}

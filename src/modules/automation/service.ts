import { db } from '@/lib/db';
import { assertAutomationPermission } from './permissions';

export async function getExecutiveAutomationDashboard(userId: string) {
  await assertAutomationPermission(userId, 'automation:read_own');

  const activeWorkflowsCount = await db.automationWorkflow.count({ where: { isActive: true } });
  const totalWorkflowsCount = await db.automationWorkflow.count();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const executionsToday = await db.automationExecution.findMany({
    where: { createdAt: { gte: startOfDay } },
  });

  const successfulTodayCount = executionsToday.filter((e) => e.status === 'COMPLETED').length;
  const failedTodayCount = executionsToday.filter((e) => e.status === 'FAILED').length;

  const totalExecutionsCount = await db.automationExecution.count();
  const totalSuccessfulCount = await db.automationExecution.count({ where: { status: 'COMPLETED' } });

  const successRate = totalExecutionsCount > 0 ? (totalSuccessfulCount / totalExecutionsCount) * 100 : 100;

  const recentLogs = await db.automationExecutionLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { execution: { include: { workflow: true } } },
  });

  return {
    activeWorkflowsCount,
    totalWorkflowsCount,
    executionsTodayCount: executionsToday.length,
    successfulTodayCount,
    failedTodayCount,
    successRate: Math.round(successRate * 10) / 10,
    recentLogs,
  };
}

export async function getExecutions(status?: string) {
  return db.automationExecution.findMany({
    where: status ? { status } : undefined,
    include: { workflow: true, stepExecutions: { include: { step: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getExecutionById(executionId: string) {
  return db.automationExecution.findUnique({
    where: { id: executionId },
    include: {
      workflow: true,
      stepExecutions: { include: { step: true }, orderBy: { sequence: 'asc' } },
      logs: { orderBy: { createdAt: 'asc' } },
    },
  });
}

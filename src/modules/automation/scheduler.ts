import { db } from '@/lib/db';
import { executeWorkflow } from './executor';

export async function processDueAutomationSchedules(
  asOfDate = new Date(),
  actorUserId = 'SYSTEM'
) {
  const dueSchedules = await db.automationSchedule.findMany({
    where: {
      isActive: true,
      nextRunAt: { lte: asOfDate },
    },
    include: { workflow: true },
  });

  const executedResults = [];

  for (const schedule of dueSchedules) {
    if (!schedule.workflow.isActive) continue;

    const dateStr = asOfDate.toISOString().slice(0, 10);
    const idempotencyKey = `Schedule:${schedule.id}:${dateStr}`;

    try {
      const result = await executeWorkflow({
        workflowId: schedule.workflowId,
        triggerType: 'SCHEDULE',
        triggerEvent: `Cron:${schedule.cronExpression}`,
        idempotencyKey,
        actorUserId,
      });

      // Update schedule nextRunAt (add 1 day default)
      const nextRun = new Date(asOfDate.getTime() + 86400000);
      await db.automationSchedule.update({
        where: { id: schedule.id },
        data: {
          lastRunAt: asOfDate,
          nextRunAt: nextRun,
        },
      });

      executedResults.push(result);
    } catch (err: any) {
      console.error(`Scheduled workflow ${schedule.workflowId} failed:`, err.message);
    }
  }

  return executedResults;
}

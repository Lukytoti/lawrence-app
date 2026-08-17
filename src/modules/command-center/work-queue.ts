import { db } from '@/lib/db';
import { WorkQueueItem } from './types';

export async function getPersonalWorkQueue(actorUserId: string): Promise<WorkQueueItem[]> {
  const items: WorkQueueItem[] = [];
  const now = new Date();

  // 1. Overdue & Due Today Tasks
  const member = await db.networkMember.findUnique({
    where: { userId: actorUserId },
  });

  if (member) {
    const tasks = await db.task.findMany({
      where: {
        assigneeId: member.id,
        status: { not: 'COMPLETED' },
      },
      take: 15,
      orderBy: { dueDate: 'asc' },
    });

    for (const t of tasks) {
      const isOverdue = t.dueDate && t.dueDate < now;
      items.push({
        id: `wq-task-${t.id}`,
        sourceDomain: 'PRODUCTIVITY',
        sourceId: t.id,
        title: t.title,
        subtitle: isOverdue ? 'OVERDUE TASK' : 'TASK DUE TODAY',
        priority: isOverdue ? 'URGENT' : (t.priority as any) || 'MEDIUM',
        dueDate: t.dueDate || undefined,
        ownerId: actorUserId,
        status: t.status,
        deepLinkRoute: '/productivity/tasks',
        recommendedAction: 'Complete Task',
      });
    }
  }

  // 2. Retention Cases
  const cases = await db.clientRetentionCase.findMany({
    where: {
      assignedOwnerId: actorUserId,
      status: { notIn: ['RESOLVED', 'CHURNED'] },
    },
    take: 10,
    orderBy: { createdAt: 'desc' },
  });

  for (const c of cases) {
    items.push({
      id: `wq-retention-${c.id}`,
      sourceDomain: 'RETENTION',
      sourceId: c.id,
      title: `Retention Case #${c.id.slice(0, 8)}`,
      subtitle: `Severity: ${c.severity} • Stage: ${c.status}`,
      priority: c.severity === 'CRITICAL' ? 'URGENT' : 'HIGH',
      ownerId: actorUserId,
      status: c.status,
      deepLinkRoute: `/retention/cases`,
      recommendedAction: 'Review Client Health',
    });
  }

  // 3. Failed Automations Requiring Attention
  const failedExecutions = await db.automationExecution.findMany({
    where: {
      status: 'FAILED',
    },
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { workflow: true },
  });

  for (const fe of failedExecutions) {
    items.push({
      id: `wq-auto-${fe.id}`,
      sourceDomain: 'AUTOMATION',
      sourceId: fe.id,
      title: `Failed Workflow: ${fe.workflow.name}`,
      subtitle: (fe as any).failureReason || (fe as any).errorMessage || 'Execution failed',
      priority: 'HIGH',
      status: fe.status,
      deepLinkRoute: `/automation/executions/${fe.id}`,
      recommendedAction: 'Retry Workflow Execution',
    });
  }

  // 4. Overdue Invoices Follow-up
  const overdueInvoices = await db.invoice.findMany({
    where: {
      status: 'OVERDUE',
    },
    take: 5,
    orderBy: { dueDate: 'asc' },
  });

  for (const inv of overdueInvoices) {
    items.push({
      id: `wq-billing-${inv.id}`,
      sourceDomain: 'BILLING',
      sourceId: inv.id,
      title: `Overdue Invoice #${inv.invoiceNumber}`,
      subtitle: `Amount Due: ₦${(Number((inv as any).amountDue ?? inv.totalAmount)).toLocaleString()}`,
      priority: 'HIGH',
      dueDate: inv.dueDate,
      status: inv.status,
      deepLinkRoute: `/billing/invoices/${inv.id}`,
      recommendedAction: 'Send Payment Reminder',
    });
  }

  // Sort work queue by priority (URGENT > HIGH > MEDIUM > LOW)
  const priorityWeight: Record<string, number> = {
    URGENT: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  return items.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
}

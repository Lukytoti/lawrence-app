import { db } from '@/lib/db';
import { ExecutiveAlert } from './types';

export async function getExecutiveAlerts(actorUserId: string): Promise<ExecutiveAlert[]> {
  const alerts: ExecutiveAlert[] = [];

  // 1. Critical Retention Cases Alerts
  const criticalCases = await db.clientRetentionCase.findMany({
    where: { severity: 'CRITICAL' },
    take: 5,
  });

  for (const c of criticalCases) {
    alerts.push({
      id: `alert-case-${c.id}`,
      severity: 'CRITICAL',
      domain: 'RETENTION',
      title: `Critical Retention Case #${c.id.slice(0, 8)}`,
      message: `Retention case for reason '${c.reason}' has CRITICAL severity. Immediate executive intervention required.`,
      actionRoute: `/retention/cases`,
      createdAt: c.updatedAt,
      sourceEntityId: c.id,
    });
  }

  // 2. Failed Automation Execution Alerts
  const failedExecutions = await db.automationExecution.findMany({
    where: { status: 'FAILED' },
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { workflow: true },
  });

  for (const fe of failedExecutions) {
    alerts.push({
      id: `alert-auto-${fe.id}`,
      severity: 'CRITICAL',
      domain: 'AUTOMATION',
      title: `Workflow Execution Failed: ${fe.workflow.name}`,
      message: (fe as any).failureReason || (fe as any).errorMessage || 'Execution threw unhandled domain exception.',
      actionRoute: `/automation/executions/${fe.id}`,
      createdAt: fe.createdAt,
      sourceEntityId: fe.id,
    });
  }

  // 3. Overdue Invoices Alerts (Warning)
  const overdueInvoices = await db.invoice.findMany({
    where: { status: 'OVERDUE' },
    take: 5,
  });

  for (const inv of overdueInvoices) {
    alerts.push({
      id: `alert-inv-${inv.id}`,
      severity: 'WARNING',
      domain: 'BILLING',
      title: `Invoice #${inv.invoiceNumber} Overdue`,
      message: `Total overdue balance: ₦${(Number((inv as any).amountDue ?? inv.totalAmount)).toLocaleString()}`,
      actionRoute: `/billing/invoices/${inv.id}`,
      createdAt: inv.updatedAt,
      sourceEntityId: inv.id,
    });
  }

  // 4. At-Risk Projects Alerts (Warning)
  const atRiskProjects = await db.digitalProject.findMany({
    where: { status: 'AT_RISK' },
    take: 5,
  });

  for (const p of atRiskProjects) {
    alerts.push({
      id: `alert-proj-${p.id}`,
      severity: 'WARNING',
      domain: 'PROJECTS',
      title: `Project At Risk: ${p.title}`,
      message: `Project ${p.projectCode} flagged as AT_RISK. Check delivery milestones.`,
      actionRoute: `/projects/${p.id}`,
      createdAt: p.updatedAt,
      sourceEntityId: p.id,
    });
  }

  // 5. Info Alerts (Recent Completed Projects)
  const recentCompletedProjects = await db.digitalProject.findMany({
    where: { status: 'COMPLETED' },
    take: 3,
    orderBy: { updatedAt: 'desc' },
  });

  for (const cp of recentCompletedProjects) {
    alerts.push({
      id: `alert-cp-${cp.id}`,
      severity: 'INFO',
      domain: 'PROJECTS',
      title: `Project Delivered: ${cp.title}`,
      message: `Project ${cp.projectCode} was successfully completed and signed off.`,
      actionRoute: `/projects/${cp.id}`,
      createdAt: cp.updatedAt,
      sourceEntityId: cp.id,
    });
  }

  // Sort by severity (CRITICAL > WARNING > INFO) then by date
  const severityOrder: Record<string, number> = {
    CRITICAL: 3,
    WARNING: 2,
    INFO: 1,
  };

  return alerts.sort((a, b) => {
    const diff = severityOrder[b.severity] - severityOrder[a.severity];
    if (diff !== 0) return diff;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

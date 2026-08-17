import { db } from '@/lib/db';
import { ComponentHealthResult, SystemHealthReport } from './types';
import { eventBus } from '@/lib/events';

async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number
): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Health check timed out (${timeoutMs}ms)`)), timeoutMs);
  });

  return Promise.race([
    fn().then((res) => {
      clearTimeout(timer);
      return res;
    }),
    timeoutPromise,
  ]);
}

export async function checkSystemHealth(): Promise<SystemHealthReport> {
  const startTime = Date.now();

  // Helper for single check
  const runCheck = async (
    component: string,
    checkFn: () => Promise<void>,
    dependencyInfo?: string
  ): Promise<ComponentHealthResult> => {
    const t0 = Date.now();
    try {
      await withTimeout(checkFn, 3000);
      return {
        component,
        status: 'HEALTHY',
        durationMs: Date.now() - t0,
        lastCheckTime: new Date(),
        dependencyInfo,
      };
    } catch (err: any) {
      return {
        component,
        status: 'DEGRADED',
        durationMs: Date.now() - t0,
        lastCheckTime: new Date(),
        message: err?.message || 'Component health check failed',
        dependencyInfo,
        remediationHint: 'Check component logs, database connections, and background workers.',
      };
    }
  };

  // Run all 11 component health checks concurrently
  const components = await Promise.all([
    // 1. Database & Prisma
    runCheck(
      'Database / Prisma Client',
      async () => {
        await db.$queryRaw`SELECT 1`;
      },
      'PostgreSQL Database Engine'
    ),

    // 2. EventBus
    runCheck(
      'EventBus Infrastructure',
      async () => {
        if (!eventBus) throw new Error('EventBus uninitialized');
      },
      'In-memory / Dispatched Event Bus'
    ),

    // 3. Auth & RBAC
    runCheck(
      'Authentication / RBAC Engine',
      async () => {
        const count = await db.permission.count();
        if (count === 0) throw new Error('No RBAC permissions found in system');
      },
      'Permission & Role Registry'
    ),

    // 4. Financial Ledger Service
    runCheck(
      'Financial Ledger Service',
      async () => {
        await db.financialAccount.findFirst({ select: { id: true } });
      },
      'Prompt 05 Double-Entry Ledger'
    ),

    // 5. CRM Service
    runCheck(
      'CRM Pipeline Service',
      async () => {
        await db.crmLead.findFirst({ select: { id: true } });
      },
      'Prompt 06 CRM Engine'
    ),

    // 6. Project Delivery Service
    runCheck(
      'Project Delivery Service',
      async () => {
        await db.digitalProject.findFirst({ select: { id: true } });
      },
      'Prompt 10 Project Engine'
    ),

    // 7. Billing & Collection Service
    runCheck(
      'Billing & Collection Service',
      async () => {
        await db.invoice.findFirst({ select: { id: true } });
      },
      'Prompt 11 Billing Engine'
    ),

    // 8. Retention Service
    runCheck(
      'Retention & Revenue Ops Service',
      async () => {
        await db.clientRetentionCase.findFirst({ select: { id: true } });
      },
      'Prompt 12 Retention Engine'
    ),

    // 9. Automation Engine
    runCheck(
      'Workflow Automation Engine',
      async () => {
        await db.automationWorkflow.findFirst({ select: { id: true } });
      },
      'Prompt 13 Workflow Engine'
    ),

    // 10. Notification Engine
    runCheck(
      'Notification Dispatch Engine',
      async () => {
        await db.notificationTemplate.findFirst({ select: { id: true } });
      },
      'Prompt 14 Communications Dispatcher'
    ),

    // 11. AI Engine
    runCheck(
      'AI Leadership Co-Pilot Engine',
      async () => {
        await db.aiConversation.findFirst({ select: { id: true } });
      },
      'Prompt 15 AI Engine'
    ),
  ]);

  const durationMs = Date.now() - startTime;
  const hasError = components.some((c) => c.status === 'ERROR');
  const hasDegraded = components.some((c) => c.status === 'DEGRADED');

  const overallStatus = hasError ? 'ERROR' : hasDegraded ? 'DEGRADED' : 'HEALTHY';

  // Save snapshot to database
  try {
    await db.systemHealthSnapshot.create({
      data: {
        overallStatus,
        componentResultsJson: JSON.stringify(components),
        durationMs,
        sourceVersion: '1.0.0',
      },
    });
  } catch (_) {
    // Ignore snapshot save failure in read-only health checks
  }

  return {
    overallStatus,
    calculatedAt: new Date(),
    durationMs,
    components,
  };
}

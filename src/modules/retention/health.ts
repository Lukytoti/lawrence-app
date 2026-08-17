import { db } from '@/lib/db';
import { HealthStatus, ScoreFactor, ClientHealthResult } from './types';
import { logAuditEvent } from '@/lib/audit';
import { eventBus } from '@/lib/events';

/**
 * Deterministic Client Health Engine.
 * Evaluates explainable factors across Billing, Project Delivery, Contract, CRM, and Touchpoints.
 * Calculates score (0 - 100) and maps to HealthStatus:
 * - 80-100: HEALTHY
 * - 65-79: STABLE
 * - 40-64: AT_RISK
 * - 1-39: CRITICAL
 * - 0: CHURNED (or if contract explicitly terminated/churned)
 */
export async function calculateClientHealth(
  clientId: string,
  actorUserId = 'SYSTEM'
): Promise<ClientHealthResult> {
  const client = await db.digitalClient.findUnique({
    where: { id: clientId },
    include: {
      contracts: true,
      invoices: true,
      digitalProjects: { include: { milestones: true } },
      touchpoints: { orderBy: { contactedAt: 'desc' }, take: 5 },
      retentionCases: { where: { status: { in: ['OPEN', 'INVESTIGATING', 'ACTION_PLAN', 'MONITORING'] } } },
    },
  });

  if (!client) throw new Error(`DigitalClient ${clientId} not found.`);

  let score = 100;
  const factors: ScoreFactor[] = [];

  // Check if client status is INACTIVE or ARCHIVED
  if (client.status === 'INACTIVE' || client.status === 'ARCHIVED') {
    score = 0;
    factors.push({ category: 'CLIENT_STATUS', impactScore: -100, description: `Client status is ${client.status}` });
  }

  // 1. Billing Overdue Analysis
  const overdueInvoices = client.invoices.filter((inv) => inv.status === 'OVERDUE');
  if (overdueInvoices.length > 0) {
    const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + Number(inv.amountDue), 0);
    const deduction = Math.min(40, overdueInvoices.length * 15);
    score -= deduction;
    factors.push({
      category: 'BILLING_OVERDUE',
      impactScore: -deduction,
      description: `${overdueInvoices.length} overdue invoice(s) totaling NGN ${totalOverdue.toLocaleString()}`,
    });
  }

  // 2. Project Delivery Health
  const blockedProjects = client.digitalProjects.filter((p) => p.status === 'BLOCKED' || p.status === 'ON_HOLD');
  if (blockedProjects.length > 0) {
    score -= 25;
    factors.push({
      category: 'PROJECT_DELIVERY',
      impactScore: -25,
      description: `${blockedProjects.length} project(s) currently blocked or on hold`,
    });
  }

  // Check overdue milestones
  const now = new Date();
  let overdueMilestoneCount = 0;
  for (const prj of client.digitalProjects) {
    const overdue = prj.milestones.filter((m) => m.status !== 'COMPLETED' && m.dueDate && new Date(m.dueDate) < now);
    overdueMilestoneCount += overdue.length;
  }
  if (overdueMilestoneCount > 0) {
    const deduction = Math.min(20, overdueMilestoneCount * 10);
    score -= deduction;
    factors.push({
      category: 'MILESTONE_DELAY',
      impactScore: -deduction,
      description: `${overdueMilestoneCount} project milestone(s) past due date`,
    });
  }

  // 3. Contract Expiration Proximity
  const activeContracts = client.contracts.filter((c) => c.status === 'ACTIVE');
  if (activeContracts.length > 0) {
    for (const c of activeContracts) {
      if (c.endDate) {
        const daysRemaining = Math.ceil((new Date(c.endDate).getTime() - now.getTime()) / (1000 * 3600 * 24));
        if (daysRemaining <= 14 && daysRemaining > 0) {
          score -= 20;
          factors.push({
            category: 'CONTRACT_EXPIRATION',
            impactScore: -20,
            description: `Active contract "${c.title}" expires in ${daysRemaining} days`,
          });
        } else if (daysRemaining <= 0) {
          score -= 30;
          factors.push({
            category: 'CONTRACT_EXPIRATION',
            impactScore: -30,
            description: `Active contract "${c.title}" has passed its expiration date`,
          });
        }
      }
    }
  }

  // 4. Client Engagement / Touchpoints Recency
  const daysSinceClientCreation = Math.ceil((now.getTime() - new Date(client.createdAt).getTime()) / (1000 * 3600 * 24));
  if (client.touchpoints.length === 0) {
    if (daysSinceClientCreation > 7) {
      score -= 15;
      factors.push({
        category: 'ENGAGEMENT_RECENCY',
        impactScore: -15,
        description: 'No touchpoint recorded for client',
      });
    }
  } else {
    const lastTouchpoint = client.touchpoints[0];
    const daysSinceLastTouch = Math.ceil((now.getTime() - new Date(lastTouchpoint.contactedAt).getTime()) / (1000 * 3600 * 24));
    if (daysSinceLastTouch > 30) {
      score -= 15;
      factors.push({
        category: 'ENGAGEMENT_RECENCY',
        impactScore: -15,
        description: `No touchpoint recorded in the last ${daysSinceLastTouch} days`,
      });
    }
  }

  // 5. Open Retention Cases
  if (client.retentionCases.length > 0) {
    const deduction = client.retentionCases.length * 15;
    score -= deduction;
    factors.push({
      category: 'RETENTION_CASES',
      impactScore: -deduction,
      description: `${client.retentionCases.length} open retention case(s)`,
    });
  }

  // Ensure score stays bounded [0, 100]
  const finalScore = Math.max(0, Math.min(100, score));

  // Resolve Health Status
  let healthStatus: HealthStatus = 'HEALTHY';
  if (finalScore === 0 || client.status === 'ARCHIVED') {
    healthStatus = 'CHURNED';
  } else if (finalScore < 40) {
    healthStatus = 'CRITICAL';
  } else if (finalScore < 65) {
    healthStatus = 'AT_RISK';
  } else if (finalScore < 80) {
    healthStatus = 'STABLE';
  }

  // Store Immutable Snapshot
  await db.clientHealthSnapshot.create({
    data: {
      clientId,
      healthStatus,
      healthScore: finalScore,
      scoreFactors: JSON.stringify(factors),
      sourceVersion: 'v1.0',
    },
  });

  await logAuditEvent({
    actorId: actorUserId,
    action: 'CLIENT_HEALTH_CALCULATED',
    entityType: 'DigitalClient',
    entityId: clientId,
    metadata: { healthStatus, healthScore: finalScore, factorsCount: factors.length },
  });

  await eventBus.publish(
    'ClientHealthChanged',
    { clientId, healthStatus, healthScore: finalScore },
    actorUserId
  );

  return {
    clientId,
    healthStatus,
    healthScore: finalScore,
    factors,
    calculatedAt: new Date(),
  };
}

export async function getLatestHealthSnapshot(clientId: string) {
  return db.clientHealthSnapshot.findFirst({
    where: { clientId },
    orderBy: { calculatedAt: 'desc' },
  });
}

export async function getHealthSnapshotHistory(clientId: string) {
  return db.clientHealthSnapshot.findMany({
    where: { clientId },
    orderBy: { calculatedAt: 'desc' },
  });
}

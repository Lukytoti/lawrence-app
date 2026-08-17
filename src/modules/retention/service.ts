import { db } from '@/lib/db';
import { assertRetentionPermission, canAccessClientRetention } from './permissions';
import { calculateClientHealth } from './health';

export async function getExecutiveRetentionDashboard(userId: string) {
  await assertRetentionPermission(userId, 'retention:read_own');

  const totalClients = await db.digitalClient.count({ where: { status: 'ACTIVE' } });

  const snapshots = await db.clientHealthSnapshot.findMany({
    orderBy: { calculatedAt: 'desc' },
    distinct: ['clientId'],
  });

  const healthyCount = snapshots.filter((s) => s.healthStatus === 'HEALTHY').length;
  const stableCount = snapshots.filter((s) => s.healthStatus === 'STABLE').length;
  const atRiskCount = snapshots.filter((s) => s.healthStatus === 'AT_RISK').length;
  const criticalCount = snapshots.filter((s) => s.healthStatus === 'CRITICAL').length;
  const churnedCount = snapshots.filter((s) => s.healthStatus === 'CHURNED').length;

  const openCasesCount = await db.clientRetentionCase.count({
    where: { status: { in: ['OPEN', 'INVESTIGATING', 'ACTION_PLAN', 'MONITORING'] } },
  });

  const renewals = await db.clientRenewal.findMany({
    where: { status: { in: ['UPCOMING', 'OUTREACH', 'NEGOTIATION'] } },
    include: { contract: true },
  });

  const renewalsDueCount = renewals.length;
  const revenueAtRisk = renewals.reduce((sum, r) => sum + Number(r.proposedValue), 0);

  const completedRenewals = await db.clientRenewal.count({ where: { status: 'RENEWED' } });
  const totalResolvedRenewals = await db.clientRenewal.count({
    where: { status: { in: ['RENEWED', 'DECLINED', 'CHURNED'] } },
  });

  const renewalRate = totalResolvedRenewals > 0 ? (completedRenewals / totalResolvedRenewals) * 100 : 100;
  const churnRate = totalClients > 0 ? (churnedCount / (totalClients + churnedCount)) * 100 : 0;

  const expansions = await db.clientExpansionOpportunity.findMany({
    where: { status: { in: ['IDENTIFIED', 'QUALIFIED', 'CONVERTED_TO_CRM'] } },
  });
  const expansionPipelineValue = expansions.reduce((sum, e) => sum + Number(e.estimatedValue), 0);

  return {
    totalClients,
    healthyCount,
    stableCount,
    atRiskCount,
    criticalCount,
    churnedCount,
    openCasesCount,
    renewalsDueCount,
    renewalRate: Math.round(renewalRate * 10) / 10,
    churnRate: Math.round(churnRate * 10) / 10,
    revenueAtRisk,
    expansionPipelineValue,
  };
}

export async function getClientSuccessDashboard(userId: string) {
  await assertRetentionPermission(userId, 'retention:read_own');

  const clients = await db.digitalClient.findMany({
    where: { status: 'ACTIVE' },
    include: {
      contracts: { where: { status: 'ACTIVE' }, orderBy: { endDate: 'asc' }, take: 1 },
      invoices: { where: { status: 'OVERDUE' } },
      digitalProjects: { select: { id: true, title: true, status: true } },
      healthSnapshots: { orderBy: { calculatedAt: 'desc' }, take: 1 },
      retentionCases: { where: { status: { in: ['OPEN', 'INVESTIGATING', 'ACTION_PLAN', 'MONITORING'] } } },
      renewals: { where: { status: { in: ['UPCOMING', 'OUTREACH', 'NEGOTIATION'] } } },
    },
    orderBy: { companyName: 'asc' },
  });

  return clients.map((c) => {
    const latestHealth = c.healthSnapshots[0];
    const activeContract = c.contracts[0];
    const overdueInvoicesCount = c.invoices.length;

    return {
      clientId: c.id,
      clientCode: c.clientCode,
      companyName: c.companyName || c.contactName,
      healthStatus: latestHealth?.healthStatus || 'HEALTHY',
      healthScore: latestHealth?.healthScore ?? 100,
      activeContractTitle: activeContract?.title || 'No active contract',
      contractEndDate: activeContract?.endDate || null,
      overdueInvoicesCount,
      projectCount: c.digitalProjects.length,
      openCasesCount: c.retentionCases.length,
      renewalStatus: c.renewals[0]?.status || 'NONE',
    };
  });
}

export async function getClientCockpitData(clientId: string, userId: string) {
  const canAccess = await canAccessClientRetention(userId, clientId);
  if (!canAccess) {
    throw new Error(`Unauthorized access to client cockpit for client ${clientId}`);
  }

  const client = await db.digitalClient.findUnique({
    where: { id: clientId },
    include: {
      contracts: { orderBy: { createdAt: 'desc' } },
      invoices: { orderBy: { createdAt: 'desc' } },
      digitalProjects: { include: { milestones: true, deliverables: true } },
      healthSnapshots: { orderBy: { calculatedAt: 'desc' } },
      retentionCases: { include: { assignedOwner: true }, orderBy: { createdAt: 'desc' } },
      renewals: { include: { contract: true, assignedOwner: true }, orderBy: { createdAt: 'desc' } },
      expansionOpportunities: { orderBy: { createdAt: 'desc' } },
      touchpoints: { include: { performedBy: true }, orderBy: { contactedAt: 'desc' } },
      riskSignals: { orderBy: { detectedAt: 'desc' } },
      successPlans: { include: { owner: true }, orderBy: { createdAt: 'desc' } },
    },
  });

  if (!client) throw new Error(`DigitalClient ${clientId} not found.`);

  return client;
}

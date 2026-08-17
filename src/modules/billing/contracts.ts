import { db } from '@/lib/db';
import { CreateContractInput, ContractStatus } from './types';
import { logAuditEvent } from '@/lib/audit';

export async function createClientContract(input: CreateContractInput, actorUserId: string) {
  const count = await db.clientContract.count();
  const year = new Date().getFullYear();
  const contractCode = `CTR-${year}-${10001 + count}-${Math.floor(100 + Math.random() * 900)}`;

  const contract = await db.clientContract.create({
    data: {
      contractCode,
      clientId: input.clientId,
      crmOpportunityId: input.crmOpportunityId,
      projectId: input.projectId,
      title: input.title,
      description: input.description,
      contractValue: input.contractValue,
      currency: input.currency || 'NGN',
      startDate: input.startDate ? new Date(input.startDate) : new Date(),
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      paymentTerms: input.paymentTerms || 'NET_30',
      status: 'DRAFT',
    },
    include: { client: true, project: true },
  });

  await logAuditEvent({
    actorId: actorUserId,
    action: 'CONTRACT_CREATED',
    entityType: 'ClientContract',
    entityId: contract.id,
    metadata: { contractCode, title: contract.title, contractValue: Number(contract.contractValue) },
  });

  return contract;
}

const ALLOWED_CONTRACT_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PENDING_SIGNATURE', 'ACTIVE', 'CANCELLED'],
  PENDING_SIGNATURE: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['PAUSED', 'COMPLETED', 'TERMINATED', 'CANCELLED'],
  PAUSED: ['ACTIVE', 'TERMINATED', 'CANCELLED'],
  COMPLETED: [],
  TERMINATED: [],
  CANCELLED: [],
};

export async function updateContractStatus(contractId: string, newStatus: ContractStatus, actorUserId: string) {
  const contract = await db.clientContract.findUnique({ where: { id: contractId } });
  if (!contract) throw new Error(`ClientContract ${contractId} not found.`);

  if (contract.status === newStatus) return contract;

  const allowed = ALLOWED_CONTRACT_TRANSITIONS[contract.status] || [];
  if (!allowed.includes(newStatus)) {
    throw new Error(`Invalid contract status transition from ${contract.status} to ${newStatus}.`);
  }

  const signedAt = newStatus === 'ACTIVE' && !contract.signedAt ? new Date() : undefined;
  const terminatedAt = (newStatus === 'TERMINATED' || newStatus === 'CANCELLED') ? new Date() : undefined;

  const updated = await db.clientContract.update({
    where: { id: contractId },
    data: {
      status: newStatus,
      signedAt: signedAt || contract.signedAt,
      terminatedAt: terminatedAt || contract.terminatedAt,
    },
  });

  await logAuditEvent({
    actorId: actorUserId,
    action: newStatus === 'ACTIVE' ? 'CONTRACT_ACTIVATED' : 'CONTRACT_UPDATED',
    entityType: 'ClientContract',
    entityId: contractId,
    metadata: { from: contract.status, to: newStatus },
  });

  return updated;
}

export async function getClientContracts(clientId?: string) {
  return db.clientContract.findMany({
    where: clientId ? { clientId } : undefined,
    include: { client: true, project: true, schedules: true, invoices: true },
    orderBy: { createdAt: 'desc' },
  });
}

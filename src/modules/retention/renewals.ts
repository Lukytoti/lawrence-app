import { db } from '@/lib/db';
import { CreateRenewalInput, RenewalStatus } from './types';
import { createClientContract } from '@/modules/billing/contracts';
import { logAuditEvent } from '@/lib/audit';
import { eventBus } from '@/lib/events';

const RENEWAL_WINDOWS = [90, 60, 30, 14, 7];

export async function detectExpiringContractsAndCreateRenewals(
  asOfDate = new Date(),
  actorUserId = 'SYSTEM'
) {
  const activeContracts = await db.clientContract.findMany({
    where: {
      status: 'ACTIVE',
      endDate: { not: null },
    },
    include: { client: true, renewals: true },
  });

  const createdRenewals = [];

  for (const contract of activeContracts) {
    if (!contract.endDate) continue;

    const daysRemaining = Math.ceil(
      (new Date(contract.endDate).getTime() - asOfDate.getTime()) / (1000 * 3600 * 24)
    );

    // Find closest expiration window
    const targetWindow = RENEWAL_WINDOWS.find((w) => daysRemaining <= w && daysRemaining > w - 15);

    if (targetWindow !== undefined) {
      // Idempotency: Check if a renewal record already exists for this contract and expirationWindowDays
      const existing = contract.renewals.find((r) => r.expirationWindowDays === targetWindow);

      if (!existing) {
        const renewal = await db.clientRenewal.create({
          data: {
            clientId: contract.clientId,
            contractId: contract.id,
            expirationWindowDays: targetWindow,
            targetRenewalDate: contract.endDate,
            proposedValue: contract.contractValue,
            currency: contract.currency,
            status: 'UPCOMING',
          },
        });

        await logAuditEvent({
          actorId: actorUserId,
          action: 'RENEWAL_CREATED',
          entityType: 'ClientRenewal',
          entityId: renewal.id,
          metadata: { contractId: contract.id, window: targetWindow },
        });

        await eventBus.publish(
          'RenewalCreated',
          { renewalId: renewal.id, contractId: contract.id, window: targetWindow },
          actorUserId
        );

        createdRenewals.push(renewal);
      }
    }
  }

  return createdRenewals;
}

export async function createManualRenewal(
  input: CreateRenewalInput,
  actorUserId: string
) {
  // Idempotency check: don't create duplicate upcoming renewal for same contract & window
  const windowDays = input.expirationWindowDays || 30;
  const existing = await db.clientRenewal.findFirst({
    where: {
      contractId: input.contractId,
      expirationWindowDays: windowDays,
      status: { in: ['UPCOMING', 'OUTREACH', 'NEGOTIATION'] },
    },
  });

  if (existing) return existing;

  const renewal = await db.clientRenewal.create({
    data: {
      clientId: input.clientId,
      contractId: input.contractId,
      expirationWindowDays: windowDays,
      targetRenewalDate: input.targetRenewalDate,
      proposedValue: input.proposedValue || 0,
      currency: input.currency || 'NGN',
      assignedOwnerId: input.assignedOwnerId,
      notes: input.notes,
      status: 'UPCOMING',
    },
  });

  await logAuditEvent({
    actorId: actorUserId,
    action: 'RENEWAL_CREATED',
    entityType: 'ClientRenewal',
    entityId: renewal.id,
    metadata: { contractId: input.contractId, targetRenewalDate: input.targetRenewalDate },
  });

  await eventBus.publish(
    'RenewalCreated',
    { renewalId: renewal.id, contractId: input.contractId },
    actorUserId
  );

  return renewal;
}

export async function updateRenewalStatus(
  renewalId: string,
  newStatus: RenewalStatus,
  notes: string | undefined,
  actorUserId: string
) {
  const currentRenewal = await db.clientRenewal.findUnique({
    where: { id: renewalId },
    include: { contract: true },
  });
  if (!currentRenewal) throw new Error(`ClientRenewal ${renewalId} not found.`);

  if (currentRenewal.status === newStatus) return currentRenewal;

  const isTerminal = newStatus === 'RENEWED' || newStatus === 'DECLINED' || newStatus === 'CHURNED';

  let newContractId: string | undefined = undefined;

  // When successfully RENEWED, preserve historical contract and invoke Prompt 11 to create new contract version!
  if (newStatus === 'RENEWED') {
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 365 * 86400000);

    const newContract = await createClientContract(
      {
        clientId: currentRenewal.clientId,
        title: `Renewed: ${currentRenewal.contract.title}`,
        contractValue: Number(currentRenewal.proposedValue) || Number(currentRenewal.contract.contractValue),
        currency: currentRenewal.currency,
        startDate,
        endDate,
        paymentTerms: `Renewal terms for contract ${currentRenewal.contract.contractCode}`,
      },
      actorUserId
    );
    newContractId = newContract.id;
  }

  const updated = await db.clientRenewal.update({
    where: { id: renewalId },
    data: {
      status: newStatus,
      notes: notes || currentRenewal.notes,
      renewedContractId: newContractId || currentRenewal.renewedContractId,
      resolvedAt: isTerminal ? new Date() : currentRenewal.resolvedAt,
    },
  });

  await logAuditEvent({
    actorId: actorUserId,
    action: newStatus === 'RENEWED' ? 'RENEWAL_RENEWED' : newStatus === 'DECLINED' ? 'RENEWAL_DECLINED' : 'RENEWAL_OUTREACH',
    entityType: 'ClientRenewal',
    entityId: renewalId,
    metadata: { fromStatus: currentRenewal.status, toStatus: newStatus, newContractId },
  });

  await eventBus.publish(
    'RenewalUpdated',
    { renewalId, status: newStatus, newContractId },
    actorUserId
  );

  return updated;
}

export async function getRenewals(clientId?: string) {
  return db.clientRenewal.findMany({
    where: clientId ? { clientId } : undefined,
    include: { client: true, contract: true, assignedOwner: true },
    orderBy: { targetRenewalDate: 'asc' },
  });
}

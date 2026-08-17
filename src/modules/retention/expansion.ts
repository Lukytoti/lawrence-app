import { db } from '@/lib/db';
import { CreateExpansionOpportunityInput, ExpansionStatus } from './types';
import { createOpportunity } from '@/modules/crm/service';
import { logAuditEvent } from '@/lib/audit';
import { eventBus } from '@/lib/events';

export async function createExpansionOpportunity(
  input: CreateExpansionOpportunityInput,
  actorUserId: string
) {
  const opp = await db.clientExpansionOpportunity.create({
    data: {
      clientId: input.clientId,
      serviceCategory: input.serviceCategory,
      title: input.title,
      description: input.description,
      estimatedValue: input.estimatedValue || 0,
      currency: input.currency || 'NGN',
      status: 'IDENTIFIED',
    },
    include: { client: true },
  });

  await logAuditEvent({
    actorId: actorUserId,
    action: 'EXPANSION_OPPORTUNITY_CREATED',
    entityType: 'ClientExpansionOpportunity',
    entityId: opp.id,
    metadata: { clientId: input.clientId, category: opp.serviceCategory, title: opp.title },
  });

  await eventBus.publish(
    'ExpansionOpportunityCreated',
    { opportunityId: opp.id, clientId: input.clientId, title: opp.title },
    actorUserId
  );

  return opp;
}

export async function convertExpansionToCrmOpportunity(
  expansionId: string,
  leadId: string,
  actorUserId: string
) {
  const expansion = await db.clientExpansionOpportunity.findUnique({
    where: { id: expansionId },
  });
  if (!expansion) throw new Error(`ClientExpansionOpportunity ${expansionId} not found.`);

  // Invoke Prompt 06 CRM Service API to create commercial opportunity
  const crmOpp = await createOpportunity({
    leadId,
    businessDomain: 'DIGITAL_MARKETING',
    title: `[Expansion] ${expansion.title}`,
    value: Number(expansion.estimatedValue),
    currency: expansion.currency,
    ownerId: actorUserId,
  });

  const updated = await db.clientExpansionOpportunity.update({
    where: { id: expansionId },
    data: {
      status: 'CONVERTED_TO_CRM',
      crmOpportunityId: crmOpp.id,
    },
  });

  await logAuditEvent({
    actorId: actorUserId,
    action: 'EXPANSION_CONVERTED_TO_CRM',
    entityType: 'ClientExpansionOpportunity',
    entityId: expansionId,
    metadata: { crmOpportunityId: crmOpp.id },
  });

  return { expansion: updated, crmOpportunity: crmOpp };
}

export async function getExpansionOpportunities(clientId?: string) {
  return db.clientExpansionOpportunity.findMany({
    where: clientId ? { clientId } : undefined,
    include: { client: true },
    orderBy: { createdAt: 'desc' },
  });
}

import { db } from '@/lib/db';
import { CreateTouchpointInput } from './types';
import { logAuditEvent } from '@/lib/audit';
import { eventBus } from '@/lib/events';

export async function createClientTouchpoint(
  input: CreateTouchpointInput,
  actorUserId: string
) {
  const touchpoint = await db.clientTouchpoint.create({
    data: {
      clientId: input.clientId,
      type: input.type,
      summary: input.summary,
      notes: input.notes,
      performedById: input.performedById,
      contactedAt: input.contactedAt || new Date(),
    },
    include: { client: true, performedBy: true },
  });

  await logAuditEvent({
    actorId: actorUserId,
    action: 'CLIENT_TOUCHPOINT_CREATED',
    entityType: 'ClientTouchpoint',
    entityId: touchpoint.id,
    metadata: { clientId: input.clientId, type: touchpoint.type, summary: touchpoint.summary },
  });

  await eventBus.publish(
    'ClientTouchpointCreated',
    { touchpointId: touchpoint.id, clientId: input.clientId, type: touchpoint.type },
    actorUserId
  );

  return touchpoint;
}

export async function getClientTouchpoints(clientId: string) {
  return db.clientTouchpoint.findMany({
    where: { clientId },
    include: { performedBy: true },
    orderBy: { contactedAt: 'desc' },
  });
}

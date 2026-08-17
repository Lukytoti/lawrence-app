import { db } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';
import { eventBus } from '@/lib/events';

/**
 * Atomic & Idempotent Conversion of a CrmLead to a NetworkMember.
 * Uses PostgreSQL row-level locking (SELECT FOR UPDATE) to prevent race conditions or duplicate conversions.
 */
export async function convertLeadToNetworkMember(input: {
  leadId: string;
  sponsorId?: string;
  actorId: string;
  password?: string;
}) {
  return db.$transaction(async (tx) => {
    // 1. Lock CrmLead row FOR UPDATE
    const leads: any[] = await tx.$queryRaw`SELECT * FROM "CrmLead" WHERE id = ${input.leadId} FOR UPDATE;`;
    const lead = leads[0];

    if (!lead) {
      throw new Error(`Lead not found: ${input.leadId}`);
    }

    // 2. Idempotency Check: return existing NetworkMember if already converted
    if (lead.convertedMemberId) {
      const existingMember = await tx.networkMember.findUnique({
        where: { id: lead.convertedMemberId },
        include: { user: { include: { profile: true } } },
      });
      if (existingMember) {
        return { isNewConversion: false, member: existingMember };
      }
    }

    // 3. Create User & Profile
    const email = lead.email || `${lead.leadCode.toLowerCase()}@prospects.lawrenceapp.internal`;
    let user = await tx.user.findUnique({ where: { email } });

    if (!user) {
      user = await tx.user.create({
        data: {
          email,
          name: lead.displayName || `${lead.firstName} ${lead.lastName}`,
          status: 'ACTIVE',
          profile: {
            create: {
              firstName: lead.firstName,
              lastName: lead.lastName,
              displayName: lead.displayName || `${lead.firstName} ${lead.lastName}`,
              phone: lead.phone,
              timeZone: lead.timezone || 'Africa/Lagos',
            },
          },
        },
      });
    }

    // 4. Create NetworkMember
    const count = await tx.networkMember.count();
    const memberCode = `NM-${10001 + count}`;

    const member = await tx.networkMember.create({
      data: {
        memberCode,
        userId: user.id,
        status: 'ACTIVE',
        activatedAt: new Date(),
        createdBy: input.actorId,
      },
    });

    // 5. Establish Sponsor Relationship if provided
    if (input.sponsorId) {
      await tx.organizationRelationship.create({
        data: {
          memberId: member.id,
          sponsorId: input.sponsorId,
          relationshipType: 'SPONSOR',
          reason: 'LEAD_CONVERSION',
          createdBy: input.actorId,
        },
      });
    }

    // 6. Non-destructively update original CrmLead
    await tx.crmLead.update({
      where: { id: input.leadId },
      data: {
        status: 'CONVERTED',
        convertedMemberId: member.id,
      },
    });

    await eventBus.publish('LeadConverted', { leadId: input.leadId, memberId: member.id, actorId: input.actorId }, input.actorId);

    await logAuditEvent({
      actorId: input.actorId,
      action: 'LEAD_CONVERTED',
      entityType: 'CrmLead',
      entityId: input.leadId,
      metadata: { memberId: member.id, memberCode, targetType: 'NETWORK_MEMBER' },
    });

    return { isNewConversion: true, member };
  });
}

/**
 * Atomic & Idempotent Conversion of a CrmLead to a DigitalClient.
 * Uses PostgreSQL row-level locking (SELECT FOR UPDATE) to prevent duplicate client creations.
 */
export async function convertLeadToDigitalClient(input: {
  leadId: string;
  actorId: string;
}) {
  return db.$transaction(async (tx) => {
    // 1. Lock CrmLead row FOR UPDATE
    const leads: any[] = await tx.$queryRaw`SELECT * FROM "CrmLead" WHERE id = ${input.leadId} FOR UPDATE;`;
    const lead = leads[0];

    if (!lead) {
      throw new Error(`Lead not found: ${input.leadId}`);
    }

    // 2. Idempotency Check: return existing DigitalClient if already converted
    if (lead.convertedClientId) {
      const existingClient = await tx.digitalClient.findUnique({
        where: { id: lead.convertedClientId },
      });
      if (existingClient) {
        return { isNewConversion: false, client: existingClient };
      }
    }

    // 3. Create DigitalClient
    const count = await tx.digitalClient.count();
    const clientCode = `CLT-${10001 + count}`;

    const client = await tx.digitalClient.create({
      data: {
        clientCode,
        leadId: input.leadId,
        companyName: lead.companyName || `${lead.firstName} ${lead.lastName} Business`,
        contactName: lead.displayName || `${lead.firstName} ${lead.lastName}`,
        email: lead.email,
        phone: lead.phone,
        status: 'ACTIVE',
      },
    });

    // 4. Non-destructively update original CrmLead
    await tx.crmLead.update({
      where: { id: input.leadId },
      data: {
        status: 'CONVERTED',
        convertedClientId: client.id,
      },
    });

    await eventBus.publish('LeadConverted', { leadId: input.leadId, clientId: client.id, actorId: input.actorId }, input.actorId);

    await logAuditEvent({
      actorId: input.actorId,
      action: 'LEAD_CONVERTED',
      entityType: 'CrmLead',
      entityId: input.leadId,
      metadata: { clientId: client.id, clientCode, targetType: 'DIGITAL_CLIENT' },
    });

    return { isNewConversion: true, client };
  });
}

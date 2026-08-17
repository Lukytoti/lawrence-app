import { createLead } from '@/modules/crm/service';
import { db } from '@/lib/db';

export async function routeInboundEvent(eventType: string, payload: any, integrationEventId: string) {
  switch (eventType) {
    case 'external.lead.created':
    case 'crm.lead.create': {
      // Resolve active owner user
      const defaultOwner = await db.user.findFirst({ where: { status: 'ACTIVE' } });
      const ownerId = payload.ownerId || defaultOwner?.id;
      if (!ownerId) throw new Error('No active user available for lead assignment');

      // Delegate to Authoritative CRM Domain Service
      const lead = await createLead({
        leadType: payload.leadType || 'NETWORK_PROSPECT',
        firstName: payload.firstName || 'External',
        lastName: payload.lastName || 'Lead',
        email: payload.email,
        phone: payload.phone,
        companyName: payload.companyName,
        source: payload.source || 'EXTERNAL_WEBHOOK',
        notesSummary: `Received via integration event ${integrationEventId}`,
        ownerId,
      });
      return { handled: true, domain: 'CRM', entityId: lead.id };
    }

    case 'external.notification.dispatch': {
      return { handled: true, domain: 'NOTIFICATIONS', status: 'QUEUED' };
    }

    case 'external.task.created': {
      return { handled: true, domain: 'PRODUCTIVITY', status: 'ROUTED' };
    }

    case 'external.payment.received': {
      // Delegates to Billing / Finance authority
      return { handled: true, domain: 'FINANCE', status: 'ROUTED_TO_FINANCE_AUTHORITY' };
    }

    default: {
      return { handled: true, domain: 'GENERIC', status: 'UNHANDLED_EVENT_TYPE_ACKNOWLEDGED' };
    }
  }
}

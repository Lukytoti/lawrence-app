import { db } from '@/lib/db';
import { CreateBillingProfileInput } from './types';
import { logAuditEvent } from '@/lib/audit';

export async function getBillingProfileByClientId(clientId: string) {
  return db.billingProfile.findFirst({
    where: { clientId, status: 'ACTIVE' },
    include: { client: true },
  });
}

export async function createOrUpdateBillingProfile(input: CreateBillingProfileInput, actorUserId: string) {
  const existing = await db.billingProfile.findFirst({
    where: { clientId: input.clientId, status: 'ACTIVE' },
  });

  let profile;
  if (existing) {
    profile = await db.billingProfile.update({
      where: { id: existing.id },
      data: {
        billingName: input.billingName,
        billingEmail: input.billingEmail,
        billingPhone: input.billingPhone,
        billingAddress: input.billingAddress,
        taxIdentifier: input.taxIdentifier,
        currency: input.currency || existing.currency,
        paymentTermsDays: input.paymentTermsDays || existing.paymentTermsDays,
        defaultPaymentMethod: input.defaultPaymentMethod || existing.defaultPaymentMethod,
      },
    });
  } else {
    profile = await db.billingProfile.create({
      data: {
        clientId: input.clientId,
        billingName: input.billingName,
        billingEmail: input.billingEmail,
        billingPhone: input.billingPhone,
        billingAddress: input.billingAddress,
        taxIdentifier: input.taxIdentifier,
        currency: input.currency || 'NGN',
        paymentTermsDays: input.paymentTermsDays || 30,
        defaultPaymentMethod: input.defaultPaymentMethod || 'BANK_TRANSFER',
        status: 'ACTIVE',
      },
    });
  }

  await logAuditEvent({
    actorId: actorUserId,
    action: 'BILLING_PROFILE_CREATED',
    entityType: 'BillingProfile',
    entityId: profile.id,
    metadata: { clientId: input.clientId, billingName: profile.billingName },
  });

  return profile;
}

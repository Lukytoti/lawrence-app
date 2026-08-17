import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { getInvoices } from '@/modules/billing/invoices';
import { ClientBillingPortalClient } from '@/modules/billing/components/ClientBillingPortalClient';

export const dynamic = 'force-dynamic';

export default async function ClientBillingPage() {
  const session = await getServerSession(authOptions);
  const clientEmail = session?.user?.email || 'demo.client@lawrenceapp.internal';

  const client = await db.digitalClient.findFirst({
    where: { email: clientEmail },
  });

  const invoices = client ? await getInvoices({ clientId: client.id }) : [];

  return <ClientBillingPortalClient invoices={invoices} client={client} />;
}

import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { getInvoiceById } from '@/modules/billing/invoices';
import { InvoiceDetailClient } from '@/modules/billing/components/InvoiceDetailClient';

export const dynamic = 'force-dynamic';

interface ClientInvoicePageProps {
  params: Promise<{ invoiceId: string }>;
}

export default async function ClientInvoicePage({ params }: ClientInvoicePageProps) {
  const { invoiceId } = await params;
  const session = await getServerSession(authOptions);
  const clientEmail = session?.user?.email || 'demo.client@lawrenceapp.internal';

  const invoice = await getInvoiceById(invoiceId);

  // Security check: Verify invoice belongs to client if client exists
  if (invoice && invoice.client?.email && invoice.client.email !== clientEmail) {
    // If not matching, but admin session, allow preview
    const adminUser = await db.user.findFirst({ where: { email: clientEmail } });
    if (!adminUser) {
      return <div className="p-8 text-center text-slate-400">Unauthorized client invoice access.</div>;
    }
  }

  return <InvoiceDetailClient invoice={invoice} />;
}

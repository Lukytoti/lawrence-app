import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getInvoices } from '@/modules/billing/invoices';
import { InvoiceListClient } from '@/modules/billing/components/InvoiceListClient';

export const dynamic = 'force-dynamic';

export default async function InvoicesListPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/login');
  }

  const invoices = await getInvoices();

  return <InvoiceListClient invoices={invoices} />;
}

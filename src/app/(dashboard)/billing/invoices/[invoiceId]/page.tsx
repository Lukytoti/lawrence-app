import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getInvoiceById } from '@/modules/billing/invoices';
import { InvoiceDetailClient } from '@/modules/billing/components/InvoiceDetailClient';

export const dynamic = 'force-dynamic';

interface InvoiceDetailPageProps {
  params: Promise<{ invoiceId: string }>;
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/login');
  }

  const { invoiceId } = await params;
  const invoice = await getInvoiceById(invoiceId);

  return <InvoiceDetailClient invoice={invoice} />;
}

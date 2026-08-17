import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getInvoices } from '@/modules/billing/invoices';
import { getUnreconciledPayments } from '@/modules/billing/reconciliation';
import { BillingDashboardClient } from '@/modules/billing/components/BillingDashboardClient';

export const dynamic = 'force-dynamic';

export default async function BillingDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/login');
  }

  const currentUser = await db.user.findUnique({
    where: { email: session.user.email },
  });

  if (!currentUser) {
    redirect('/login');
  }

  const invoices = await getInvoices();
  const unreconciled = await getUnreconciledPayments();

  return <BillingDashboardClient invoices={invoices} unreconciledPayments={unreconciled} userId={currentUser.id} />;
}

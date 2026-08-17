import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUnreconciledPayments } from '@/modules/billing/reconciliation';
import { ReconciliationClient } from '@/modules/billing/components/ReconciliationClient';

export const dynamic = 'force-dynamic';

export default async function ReconciliationPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/login');
  }

  const unreconciled = await getUnreconciledPayments();

  return <ReconciliationClient unreconciledPayments={unreconciled} />;
}

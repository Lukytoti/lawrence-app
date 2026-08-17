import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getClientContracts } from '@/modules/billing/contracts';
import { ContractBillingClient } from '@/modules/billing/components/ContractBillingClient';

export const dynamic = 'force-dynamic';

export default async function ContractsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/login');
  }

  const contracts = await getClientContracts();

  return <ContractBillingClient contracts={contracts} />;
}

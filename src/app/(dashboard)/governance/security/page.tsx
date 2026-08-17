import React from 'react';
import SecurityOperationsClient from '@/modules/governance/components/SecurityOperationsClient';
import { getSecurityOverview } from '@/modules/governance/service';

export const metadata = {
  title: 'Security Operations | Lawrence Operating System',
  description: 'Security event log, rate limiting & secret exposure monitoring.',
};

export default async function SecurityOperationsPage() {
  const data = await getSecurityOverview();
  return <SecurityOperationsClient data={data} />;
}

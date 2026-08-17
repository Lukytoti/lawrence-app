import React from 'react';
import RiskRegisterClient from '@/modules/governance/components/RiskRegisterClient';
import { db } from '@/lib/db';

export const metadata = {
  title: 'Risk Register | Lawrence Operating System',
  description: 'Security risk matrix & likelihood x impact scoring.',
};

export default async function RiskRegisterPage() {
  const risks = await db.securityRisk.findMany({
    orderBy: { riskScore: 'desc' },
    take: 50,
  });

  return <RiskRegisterClient risks={risks} />;
}

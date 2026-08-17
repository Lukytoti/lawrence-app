import React from 'react';
import GovernanceDashboardClient from '@/modules/governance/components/GovernanceDashboardClient';
import { getGovernanceOverview } from '@/modules/governance/service';
import { db } from '@/lib/db';

export const metadata = {
  title: 'Admin Governance Controls | Lawrence Operating System',
  description: 'Super Admin platform governance, compliance controls & security risk management.',
};

export default async function AdminGovernancePage() {
  const superAdmin = await db.user.findFirst({ where: { status: 'ACTIVE' } });
  const actorUserId = superAdmin?.id || 'SYSTEM';

  const data = await getGovernanceOverview(actorUserId);

  return <GovernanceDashboardClient data={data} />;
}

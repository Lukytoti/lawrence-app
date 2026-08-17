import React from 'react';
import GovernanceDashboardClient from '@/modules/governance/components/GovernanceDashboardClient';
import { getGovernanceOverview } from '@/modules/governance/service';
import { db } from '@/lib/db';

export const metadata = {
  title: 'Platform Governance Hub | Lawrence Operating System',
  description: 'Enterprise security, governance, incident management, access review, compliance & observability.',
};

export default async function GovernancePage() {
  const admin = await db.user.findFirst({ where: { status: 'ACTIVE' } });
  const actorUserId = admin?.id || 'SYSTEM';

  const data = await getGovernanceOverview(actorUserId);

  return <GovernanceDashboardClient data={data} />;
}

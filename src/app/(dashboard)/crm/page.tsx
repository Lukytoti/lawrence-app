import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { CrmDashboardClient } from '@/modules/crm/components/CrmDashboardClient';

export default async function CrmDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login');
  }

  const user = session.user as any;

  // Fetch leads for owner or all if admin
  const leads = await db.crmLead.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const hotLeads = leads.filter((l) => l.temperature === 'HOT').length;
  const opps = await db.crmOpportunity.findMany({ where: { status: 'OPEN' } });
  const openOpportunities = opps.length;
  const totalPipelineValue = opps.reduce((acc, o) => acc + Number(o.value), 0);

  return (
    <CrmDashboardClient
      leads={leads.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
      }))}
      stats={{
        totalLeads: leads.length,
        hotLeads,
        openOpportunities,
        totalPipelineValue,
      }}
    />
  );
}

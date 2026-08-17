import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getExecutiveAutomationDashboard } from '@/modules/automation/service';
import { AutomationDashboardClient } from '@/modules/automation/components/AutomationDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AutomationDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/login');

  const currentUser = await db.user.findUnique({
    where: { email: session.user.email },
  });
  if (!currentUser) redirect('/login');

  const metrics = await getExecutiveAutomationDashboard(currentUser.id);

  return <AutomationDashboardClient metrics={metrics} />;
}

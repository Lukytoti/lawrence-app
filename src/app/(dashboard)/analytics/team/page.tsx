import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getExecutiveDashboardData } from '@/modules/analytics/service';
import { TeamAnalyticsClient } from '@/modules/analytics/components/TeamAnalyticsClient';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function TeamAnalyticsPage() {
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

  const teamData = await getExecutiveDashboardData(currentUser.id, 'TEAM');

  return <TeamAnalyticsClient data={teamData} />;
}

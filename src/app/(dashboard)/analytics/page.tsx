import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getExecutiveDashboardData } from '@/modules/analytics/service';
import { ExecutiveDashboardClient } from '@/modules/analytics/components/ExecutiveDashboardClient';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ExecutiveAnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/login');
  }

  // Fetch user from DB by email
  const currentUser = await db.user.findUnique({
    where: { email: session.user.email },
  });

  if (!currentUser) {
    redirect('/login');
  }

  const initialData = await getExecutiveDashboardData(currentUser.id, 'GLOBAL');

  return <ExecutiveDashboardClient initialData={initialData} userId={currentUser.id} />;
}

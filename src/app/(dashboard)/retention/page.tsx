import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getExecutiveRetentionDashboard } from '@/modules/retention/service';
import { RetentionDashboardClient } from '@/modules/retention/components/RetentionDashboardClient';

export const dynamic = 'force-dynamic';

export default async function RetentionDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/login');

  const currentUser = await db.user.findUnique({
    where: { email: session.user.email },
  });
  if (!currentUser) redirect('/login');

  const metrics = await getExecutiveRetentionDashboard(currentUser.id);

  return <RetentionDashboardClient metrics={metrics} />;
}

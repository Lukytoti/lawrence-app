import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getExecutiveNotificationDashboard } from '@/modules/notifications/service';
import { NotificationDashboardClient } from '@/modules/notifications/components/NotificationDashboardClient';

export default async function NotificationDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const userId = (session.user as any).id;
  const data = await getExecutiveNotificationDashboard(userId);
  return <NotificationDashboardClient initialData={data} />;
}

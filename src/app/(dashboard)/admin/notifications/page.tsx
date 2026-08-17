import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { assertNotificationPermission } from '@/modules/notifications/permissions';
import { AdminNotificationClient } from '@/modules/notifications/components/AdminNotificationClient';

export default async function AdminNotificationPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const userId = (session.user as any).id;
  try {
    await assertNotificationPermission(userId, 'notifications:admin');
  } catch {
    redirect('/overview');
  }

  return <AdminNotificationClient />;
}

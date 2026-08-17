import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUserNotificationPreferences } from '@/modules/notifications/preferences';
import { PreferenceClient } from '@/modules/notifications/components/PreferenceClient';

export default async function NotificationPreferencesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const userId = (session.user as any).id;
  const preference = await getUserNotificationPreferences(userId);
  return <PreferenceClient initialPreference={preference} currentUserId={userId} />;
}

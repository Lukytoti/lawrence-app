import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getNotificationTemplates } from '@/modules/notifications/service';
import { TemplateListClient } from '@/modules/notifications/components/TemplateListClient';

export default async function NotificationTemplatesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const userId = (session.user as any).id;
  const templates = await getNotificationTemplates(userId);
  return <TemplateListClient initialTemplates={templates} currentUserId={userId} />;
}

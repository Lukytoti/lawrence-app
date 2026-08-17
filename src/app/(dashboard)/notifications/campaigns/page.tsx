import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getNotificationCampaigns } from '@/modules/notifications/service';
import { CampaignListClient } from '@/modules/notifications/components/CampaignListClient';

export default async function NotificationCampaignsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const userId = (session.user as any).id;
  const campaigns = await getNotificationCampaigns(userId);
  return <CampaignListClient initialCampaigns={campaigns} currentUserId={userId} />;
}

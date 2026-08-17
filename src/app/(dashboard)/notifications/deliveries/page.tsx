import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getNotificationDeliveries } from '@/modules/notifications/service';
import { DeliveryListClient } from '@/modules/notifications/components/DeliveryListClient';

export default async function NotificationDeliveriesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const userId = (session.user as any).id;
  const deliveries = await getNotificationDeliveries(userId);
  return <DeliveryListClient initialDeliveries={deliveries} />;
}

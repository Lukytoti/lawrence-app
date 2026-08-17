import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { getUserPermissions } from '@/lib/rbac';
import { getUserNotifications } from '@/lib/notifications';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/login');
  }

  const userId = (session.user as any).id;
  const userPermissions = await getUserPermissions(userId);
  const initialNotifications = await getUserNotifications(userId, 10);

  const formattedNotifications = initialNotifications.map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    link: n.link,
    isRead: n.isRead,
    createdAt: n.createdAt,
  }));

  const userContext = {
    id: userId,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
    roles: (session.user as any).roles || [],
    permissions: userPermissions,
  };

  return (
    <AppShell user={userContext} initialNotifications={formattedNotifications}>
      {children}
    </AppShell>
  );
}

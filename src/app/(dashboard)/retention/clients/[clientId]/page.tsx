import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getClientCockpitData } from '@/modules/retention/service';
import { ClientCockpitClient } from '@/modules/retention/components/ClientCockpitClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ clientId: string }>;
}

export default async function ClientCockpitPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/login');

  const currentUser = await db.user.findUnique({
    where: { email: session.user.email },
  });
  if (!currentUser) redirect('/login');

  const { clientId } = await params;
  const clientData = await getClientCockpitData(clientId, currentUser.id);

  return <ClientCockpitClient client={clientData} currentUserId={currentUser.id} />;
}

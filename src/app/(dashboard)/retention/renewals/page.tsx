import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getRenewals } from '@/modules/retention/renewals';
import { RenewalWorkspaceClient } from '@/modules/retention/components/RenewalWorkspaceClient';

export const dynamic = 'force-dynamic';

export default async function RenewalWorkspacePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/login');

  const currentUser = await db.user.findUnique({
    where: { email: session.user.email },
  });
  if (!currentUser) redirect('/login');

  const renewals = await getRenewals();

  return <RenewalWorkspaceClient renewals={renewals} currentUserId={currentUser.id} />;
}

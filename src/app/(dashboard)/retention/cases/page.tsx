import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getRetentionCases } from '@/modules/retention/cases';
import { RetentionCasesClient } from '@/modules/retention/components/RetentionCasesClient';

export const dynamic = 'force-dynamic';

export default async function RetentionCasesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/login');

  const currentUser = await db.user.findUnique({
    where: { email: session.user.email },
  });
  if (!currentUser) redirect('/login');

  const cases = await getRetentionCases();

  return <RetentionCasesClient cases={cases} currentUserId={currentUser.id} />;
}

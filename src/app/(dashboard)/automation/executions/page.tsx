import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getExecutions } from '@/modules/automation/service';
import { ExecutionListClient } from '@/modules/automation/components/ExecutionListClient';

export const dynamic = 'force-dynamic';

export default async function ExecutionListPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/login');

  const currentUser = await db.user.findUnique({
    where: { email: session.user.email },
  });
  if (!currentUser) redirect('/login');

  const executions = await getExecutions();

  return <ExecutionListClient executions={executions} />;
}

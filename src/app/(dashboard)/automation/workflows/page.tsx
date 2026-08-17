import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getWorkflows } from '@/modules/automation/workflows';
import { WorkflowListClient } from '@/modules/automation/components/WorkflowListClient';

export const dynamic = 'force-dynamic';

export default async function WorkflowListPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/login');

  const currentUser = await db.user.findUnique({
    where: { email: session.user.email },
  });
  if (!currentUser) redirect('/login');

  const workflows = await getWorkflows();

  return <WorkflowListClient workflows={workflows} currentUserId={currentUser.id} />;
}

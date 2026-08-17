import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getWorkflowById } from '@/modules/automation/workflows';
import { WorkflowDetailClient } from '@/modules/automation/components/WorkflowDetailClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ workflowId: string }>;
}

export default async function WorkflowDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/login');

  const currentUser = await db.user.findUnique({
    where: { email: session.user.email },
  });
  if (!currentUser) redirect('/login');

  const { workflowId } = await params;
  const workflow = await getWorkflowById(workflowId);
  if (!workflow) redirect('/automation/workflows');

  return <WorkflowDetailClient workflow={workflow} currentUserId={currentUser.id} />;
}

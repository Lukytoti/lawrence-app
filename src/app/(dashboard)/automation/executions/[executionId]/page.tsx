import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getExecutionById } from '@/modules/automation/service';
import { ExecutionDetailClient } from '@/modules/automation/components/ExecutionDetailClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ executionId: string }>;
}

export default async function ExecutionDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/login');

  const currentUser = await db.user.findUnique({
    where: { email: session.user.email },
  });
  if (!currentUser) redirect('/login');

  const { executionId } = await params;
  const execution = await getExecutionById(executionId);
  if (!execution) redirect('/automation/executions');

  return <ExecutionDetailClient execution={execution} />;
}

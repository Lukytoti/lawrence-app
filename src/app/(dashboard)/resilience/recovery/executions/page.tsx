import React from 'react';
import RecoveryExecutionClient from '@/modules/resilience/components/RecoveryExecutionClient';
import { db } from '@/lib/db';

export const metadata = {
  title: 'Recovery Executions | Lawrence Operating System',
  description: 'Track live and completed disaster recovery plan executions.',
};

export default async function RecoveryExecutionsPage() {
  const executions = await db.recoveryExecution.findMany({
    orderBy: { startedAt: 'desc' },
    take: 50,
    include: {
      recoveryPlan: true,
      initiatedBy: { select: { name: true, email: true } },
    },
  });

  return <RecoveryExecutionClient executions={executions} />;
}

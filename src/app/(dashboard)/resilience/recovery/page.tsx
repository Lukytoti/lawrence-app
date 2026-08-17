import React from 'react';
import RecoveryPlanClient from '@/modules/resilience/components/RecoveryPlanClient';
import { db } from '@/lib/db';

export const metadata = {
  title: 'Disaster Recovery Plans | Lawrence Operating System',
  description: 'Manage disaster recovery runbooks, step ordering and execution objectives.',
};

export default async function RecoveryPage() {
  const plans = await db.recoveryPlan.findMany({
    orderBy: { priority: 'asc' },
    include: {
      steps: { orderBy: { stepNumber: 'asc' } },
    },
  });

  return <RecoveryPlanClient plans={plans} />;
}

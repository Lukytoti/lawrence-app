import React from 'react';
import RecoveryPlanClient from '@/modules/resilience/components/RecoveryPlanClient';
import { db } from '@/lib/db';

export const metadata = {
  title: 'DR Recovery Plans | Lawrence Operating System',
  description: 'Manage disaster recovery plans and step configurations.',
};

export default async function RecoveryPlansPage() {
  const plans = await db.recoveryPlan.findMany({
    orderBy: { priority: 'asc' },
    include: {
      steps: { orderBy: { stepNumber: 'asc' } },
    },
  });

  return <RecoveryPlanClient plans={plans} />;
}

import React from 'react';
import RecoveryDrillClient from '@/modules/resilience/components/RecoveryDrillClient';
import { db } from '@/lib/db';

export const metadata = {
  title: 'Recovery Drills & Simulations | Lawrence Operating System',
  description: 'Schedule, execute and review controlled disaster recovery drills.',
};

export default async function DrillsPage() {
  const drills = await db.recoveryExecution.findMany({
    where: { triggerType: 'DRILL' },
    orderBy: { startedAt: 'desc' },
    take: 50,
    include: {
      recoveryPlan: true,
      initiatedBy: { select: { name: true, email: true } },
    },
  });

  return <RecoveryDrillClient drills={drills} />;
}

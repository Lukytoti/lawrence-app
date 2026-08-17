import React from 'react';
import ContinuityPlanClient from '@/modules/resilience/components/ContinuityPlanClient';
import { db } from '@/lib/db';

export const metadata = {
  title: 'Business Continuity Plans | Lawrence Operating System',
  description: 'Business continuity plans, minimum operating levels and responsible roles.',
};

export default async function ContinuityPage() {
  const plans = await db.continuityPlan.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      procedures: { orderBy: { sequence: 'asc' } },
      owner: { select: { name: true, email: true } },
    },
  });

  return <ContinuityPlanClient plans={plans} />;
}

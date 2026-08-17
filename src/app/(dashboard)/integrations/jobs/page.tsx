import React from 'react';
import IntegrationJobsClient from '@/modules/integrations/components/IntegrationJobsClient';
import { db } from '@/lib/db';

export const metadata = {
  title: 'Sync Jobs | Lawrence Operating System',
  description: 'Scheduled synchronization tasks and exponential backoff retry schedules.',
};

export default async function JobsPage() {
  const jobs = await db.integrationJob.findMany({
    orderBy: { scheduledAt: 'desc' },
    take: 50,
  });

  return <IntegrationJobsClient jobs={jobs} />;
}

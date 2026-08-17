import React from 'react';
import ResilienceDashboardClient from '@/modules/resilience/components/ResilienceDashboardClient';
import { getResilienceDashboard } from '@/modules/resilience/service';

export const metadata = {
  title: 'Resilience & Business Continuity | Lawrence Operating System',
  description: 'Platform resilience, backup governance, disaster recovery execution & dependency topology.',
};

export default async function ResiliencePage() {
  const data = await getResilienceDashboard();
  return <ResilienceDashboardClient data={data} />;
}

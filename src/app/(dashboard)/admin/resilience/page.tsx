import React from 'react';
import ResilienceDashboardClient from '@/modules/resilience/components/ResilienceDashboardClient';
import { getResilienceDashboard } from '@/modules/resilience/service';

export const metadata = {
  title: 'Admin Resilience Controls | Lawrence Operating System',
  description: 'Enterprise resilience administration, backup policies, DR procedures and continuity.',
};

export default async function AdminResiliencePage() {
  const data = await getResilienceDashboard();
  return <ResilienceDashboardClient data={data} />;
}

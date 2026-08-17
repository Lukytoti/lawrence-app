import React from 'react';
import ResilienceIncidentClient from '@/modules/resilience/components/ResilienceIncidentClient';
import { db } from '@/lib/db';

export const metadata = {
  title: 'Resilience Incidents | Lawrence Operating System',
  description: 'Track and manage platform resilience and recovery incidents.',
};

export default async function IncidentsPage() {
  const incidents = await db.resilienceIncident.findMany({
    orderBy: { detectedAt: 'desc' },
    take: 50,
  });

  return <ResilienceIncidentClient incidents={incidents} />;
}

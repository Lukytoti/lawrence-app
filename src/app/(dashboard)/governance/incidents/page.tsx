import React from 'react';
import IncidentCenterClient from '@/modules/governance/components/IncidentCenterClient';
import { db } from '@/lib/db';

export const metadata = {
  title: 'Incident Response Center | Lawrence Operating System',
  description: 'Security & operational incident response lifecycle.',
};

export default async function IncidentCenterPage() {
  const incidents = await db.securityIncident.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return <IncidentCenterClient incidents={incidents} />;
}

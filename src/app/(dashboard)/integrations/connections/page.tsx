import React from 'react';
import ConnectionListClient from '@/modules/integrations/components/ConnectionListClient';
import { db } from '@/lib/db';

export const metadata = {
  title: 'Environment Connections | Lawrence Operating System',
  description: 'Reference-based credential security and connection configurations.',
};

export default async function ConnectionsPage() {
  const connections = await db.integrationConnection.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return <ConnectionListClient connections={connections} />;
}

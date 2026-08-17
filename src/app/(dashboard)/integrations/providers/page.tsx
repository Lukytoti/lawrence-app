import React from 'react';
import IntegrationListClient from '@/modules/integrations/components/IntegrationListClient';
import { db } from '@/lib/db';

export const metadata = {
  title: 'Integration Providers | Lawrence Operating System',
  description: 'Registered external providers and connection protocols.',
};

export default async function ProvidersPage() {
  const integrations = await db.integration.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return <IntegrationListClient integrations={integrations} />;
}

import React from 'react';
import IntegrationListClient from '@/modules/integrations/components/IntegrationListClient';
import { db } from '@/lib/db';

export const metadata = {
  title: 'Integration Detail | Lawrence Operating System',
  description: 'Integration detail configuration and connections.',
};

export default async function IntegrationDetailPage() {
  const integrations = await db.integration.findMany({ take: 10 });
  return <IntegrationListClient integrations={integrations} />;
}

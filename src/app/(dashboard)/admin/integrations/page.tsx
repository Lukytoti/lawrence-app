import React from 'react';
import IntegrationDashboardClient from '@/modules/integrations/components/IntegrationDashboardClient';
import { getIntegrationDashboard } from '@/modules/integrations/service';

export const metadata = {
  title: 'Admin Integrations Gateway | Lawrence Operating System',
  description: 'Super Admin integration gateway controls and connectivity engine.',
};

export default async function AdminIntegrationsPage() {
  const data = await getIntegrationDashboard();
  return <IntegrationDashboardClient data={data} />;
}

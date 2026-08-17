import React from 'react';
import IntegrationDashboardClient from '@/modules/integrations/components/IntegrationDashboardClient';
import { getIntegrationDashboard } from '@/modules/integrations/service';

export const metadata = {
  title: 'Integrations & API Gateway | Lawrence Operating System',
  description: 'Secure integrations, inbound/outbound webhooks, dead-letter queue & API request engine.',
};

export default async function IntegrationsPage() {
  const data = await getIntegrationDashboard();
  return <IntegrationDashboardClient data={data} />;
}

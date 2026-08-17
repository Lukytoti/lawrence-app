import React from 'react';
import IntegrationLogsClient from '@/modules/integrations/components/IntegrationLogsClient';
import { db } from '@/lib/db';

export const metadata = {
  title: 'Integration Logs | Lawrence Operating System',
  description: 'Sanitized gateway execution logs and request audit trail.',
};

export default async function IntegrationLogsPage() {
  const logs = await db.integrationLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return <IntegrationLogsClient logs={logs} />;
}

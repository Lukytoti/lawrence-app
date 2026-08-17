import React from 'react';
import { checkSystemHealth } from '@/modules/command-center/health';
import { SystemHealthClient } from '@/modules/command-center/components/SystemHealthClient';

export const dynamic = 'force-dynamic';

export default async function HealthPage() {
  const report = await checkSystemHealth();

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-black text-white tracking-tight">System Operational Health Monitoring</h1>
        <p className="text-xs text-slate-400 mt-1">
          Real-time latency and status health checks for database, Prisma, event bus, and 9 domain services.
        </p>
      </div>

      <SystemHealthClient report={report} />
    </div>
  );
}

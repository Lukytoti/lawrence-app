import React from 'react';
import { db } from '@/lib/db';
import { getExecutiveAlerts } from '@/modules/command-center/alerts';
import { AlertCenterClient } from '@/modules/command-center/components/AlertCenterClient';

export const dynamic = 'force-dynamic';

export default async function AlertsPage() {
  const superAdmin = await db.user.findFirst({
    where: { email: 'oluwatobi@lawrenceapp.internal' },
  });
  const actorUserId = superAdmin?.id || 'system-admin';

  const alerts = await getExecutiveAlerts(actorUserId);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-black text-white tracking-tight">Executive Alert Center</h1>
        <p className="text-xs text-slate-400 mt-1">
          Operational warning, critical, and info alerts aggregated across active business domains.
        </p>
      </div>

      <AlertCenterClient alerts={alerts} />
    </div>
  );
}

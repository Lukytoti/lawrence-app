import React from 'react';
import { db } from '@/lib/db';
import { getExecutiveKpiSummary } from '@/modules/command-center/service';
import { getPersonalWorkQueue } from '@/modules/command-center/work-queue';
import { getExecutiveAlerts } from '@/modules/command-center/alerts';
import { getUniversalActivityTimeline } from '@/modules/command-center/activity';
import { checkSystemHealth } from '@/modules/command-center/health';
import { CommandCenterClient } from '@/modules/command-center/components/CommandCenterClient';

export const dynamic = 'force-dynamic';

export default async function CommandCenterPage() {
  const superAdmin = await db.user.findFirst({
    where: { email: 'oluwatobi@lawrenceapp.internal' },
  });
  const actorUserId = superAdmin?.id || 'system-admin';

  const [kpiSummary, workQueue, alerts, timeline, healthReport] = await Promise.all([
    getExecutiveKpiSummary(actorUserId),
    getPersonalWorkQueue(actorUserId),
    getExecutiveAlerts(actorUserId),
    getUniversalActivityTimeline(actorUserId, 20),
    checkSystemHealth(),
  ]);

  return (
    <CommandCenterClient
      actorUserId={actorUserId}
      kpiSummary={kpiSummary}
      workQueue={workQueue}
      alerts={alerts}
      timeline={timeline}
      healthReport={healthReport}
    />
  );
}

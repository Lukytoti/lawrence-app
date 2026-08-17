import React from 'react';
import { db } from '@/lib/db';
import { getUniversalActivityTimeline } from '@/modules/command-center/activity';
import { ActivityTimelineClient } from '@/modules/command-center/components/ActivityTimelineClient';

export const dynamic = 'force-dynamic';

export default async function ActivityPage() {
  const superAdmin = await db.user.findFirst({
    where: { email: 'oluwatobi@lawrenceapp.internal' },
  });
  const actorUserId = superAdmin?.id || 'system-admin';

  const timeline = await getUniversalActivityTimeline(actorUserId, 50);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-black text-white tracking-tight">Universal System Activity Timeline</h1>
        <p className="text-xs text-slate-400 mt-1">
          Complete cross-domain audit logs and event bus activity history.
        </p>
      </div>

      <ActivityTimelineClient timeline={timeline} />
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import {
  ExecutiveKpiSummary,
  WorkQueueItem,
  ExecutiveAlert,
  ActivityTimelineItem,
  SystemHealthReport,
} from '../types';
import { ExecutiveKpiGrid } from './ExecutiveKpiGrid';
import { AiCommandBarClient } from './AiCommandBarClient';
import { WorkQueueClient } from './WorkQueueClient';
import { AlertCenterClient } from './AlertCenterClient';
import { ActivityTimelineClient } from './ActivityTimelineClient';
import { CommandPaletteClient } from './CommandPaletteClient';
import { QuickActionsClient } from './QuickActionsClient';
import { Command, Activity } from 'lucide-react';
import Link from 'next/link';

interface CommandCenterClientProps {
  actorUserId: string;
  kpiSummary: ExecutiveKpiSummary;
  workQueue: WorkQueueItem[];
  alerts: ExecutiveAlert[];
  timeline: ActivityTimelineItem[];
  healthReport: SystemHealthReport;
}

export const CommandCenterClient: React.FC<CommandCenterClientProps> = ({
  actorUserId,
  kpiSummary,
  workQueue,
  alerts,
  timeline,
  healthReport,
}) => {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span className="bg-gradient-to-r from-wine-400 to-rose-500 bg-clip-text text-transparent">
              Unified Executive Command Center
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time cross-domain operations, search, activity, and executive decision hub.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPaletteOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium hover:border-wine-800 transition-colors"
          >
            <Command className="w-4 h-4 text-wine-400" />
            <span>Command Palette</span>
            <kbd className="px-1.5 py-0.5 bg-slate-800 text-[10px] text-slate-400 rounded">⌘K</kbd>
          </button>

          <QuickActionsClient actorUserId={actorUserId} />

          <Link
            href="/command-center/health"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
              healthReport.overallStatus === 'HEALTHY'
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Health: {healthReport.overallStatus}</span>
          </Link>
        </div>
      </div>

      {/* AI Command Bar */}
      <AiCommandBarClient actorUserId={actorUserId} />

      {/* Cross-Domain Executive KPI Grid */}
      <ExecutiveKpiGrid summary={kpiSummary} />

      {/* Two Column Layout for Operations & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WorkQueueClient items={workQueue} />
        <AlertCenterClient alerts={alerts} />
      </div>

      {/* Universal Activity Timeline */}
      <ActivityTimelineClient timeline={timeline} />

      {/* Command Palette Modal */}
      <CommandPaletteClient
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        actorUserId={actorUserId}
      />
    </div>
  );
};

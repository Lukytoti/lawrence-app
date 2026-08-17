'use client';

import React from 'react';
import { ActivityTimelineItem } from '../types';
import Link from 'next/link';
import { ScrollText, Activity, ArrowUpRight } from 'lucide-react';

interface ActivityTimelineClientProps {
  timeline: ActivityTimelineItem[];
}

export const ActivityTimelineClient: React.FC<ActivityTimelineClientProps> = ({ timeline }) => {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="p-6 text-center border border-slate-800 rounded-xl bg-slate-900/40 text-slate-400">
        <ScrollText className="w-8 h-8 text-slate-500 mx-auto mb-2" />
        <p className="font-medium">No Recent Audit Logs</p>
        <p className="text-xs text-slate-500">Activity logs will populate as system operations are performed.</p>
      </div>
    );
  }

  return (
    <div className="border border-slate-800 rounded-xl bg-slate-900/60 p-4 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-wine-400" />
          <h3 className="text-base font-semibold text-white">Universal Activity Timeline</h3>
        </div>
        <span className="text-xs text-slate-400">Recent audit & event bus history</span>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {timeline.map((item) => (
          <div key={item.id} className="relative flex items-start justify-between group">
            <div className="absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full bg-wine-500 ring-4 ring-slate-900" />
            <div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-white">{item.actorName}</span>
                <span className="text-slate-500">•</span>
                <span className="text-wine-400 font-medium">{item.event}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">{item.domain}</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Target: {item.entityType} ({item.entityId})
              </p>
              <span className="text-[10px] text-slate-500">{new Date(item.timestamp).toLocaleString()}</span>
            </div>

            {item.route && (
              <Link
                href={item.route}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-white"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

'use client';

import React from 'react';
import { WorkQueueItem } from '../types';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Clock, ArrowRight } from 'lucide-react';

interface WorkQueueClientProps {
  items: WorkQueueItem[];
}

export const WorkQueueClient: React.FC<WorkQueueClientProps> = ({ items }) => {
  if (!items || items.length === 0) {
    return (
      <div className="p-6 text-center border border-slate-800 rounded-xl bg-slate-900/40 text-slate-400">
        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
        <p className="font-medium">Your work queue is completely clear!</p>
        <p className="text-xs text-slate-500">No overdue tasks, critical cases, or action items pending.</p>
      </div>
    );
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <span className="px-2 py-0.5 text-xs font-bold bg-rose-950 text-rose-300 border border-rose-800 rounded">URGENT</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-800 rounded">HIGH</span>;
      default:
        return <span className="px-2 py-0.5 text-xs bg-slate-800 text-slate-300 border border-slate-700 rounded">{priority}</span>;
    }
  };

  return (
    <div className="border border-slate-800 rounded-xl bg-slate-900/60 p-4 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-wine-400" />
          <h3 className="text-base font-semibold text-white">Personal Work Queue</h3>
        </div>
        <span className="text-xs text-slate-400">{items.length} items requiring attention</span>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 rounded-lg border border-slate-800/80 bg-slate-950/40 hover:border-wine-800/60 transition-all"
          >
            <div className="flex items-center gap-3">
              {getPriorityBadge(item.priority)}
              <div>
                <div className="text-sm font-medium text-white">{item.title}</div>
                <div className="text-xs text-slate-400">{item.subtitle} • {item.sourceDomain}</div>
              </div>
            </div>

            <Link
              href={item.deepLinkRoute}
              className="flex items-center gap-1 text-xs font-semibold text-wine-400 hover:text-wine-300 px-3 py-1.5 rounded-lg bg-wine-950/40 border border-wine-800/40 hover:bg-wine-900/40 transition-colors"
            >
              <span>{item.recommendedAction}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

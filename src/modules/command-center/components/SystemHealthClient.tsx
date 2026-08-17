'use client';

import React from 'react';
import { SystemHealthReport } from '../types';
import { Activity, CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

interface SystemHealthClientProps {
  report: SystemHealthReport;
}

export const SystemHealthClient: React.FC<SystemHealthClientProps> = ({ report }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return (
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>HEALTHY</span>
          </span>
        );
      case 'DEGRADED':
        return (
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>DEGRADED</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
            <XCircle className="w-3.5 h-3.5" />
            <span>ERROR</span>
          </span>
        );
    }
  };

  return (
    <div className="border border-slate-800 rounded-xl bg-slate-900/60 p-6 shadow-lg space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-wine-400" />
          <div>
            <h2 className="text-lg font-bold text-white">System Operations & Component Health</h2>
            <p className="text-xs text-slate-400">
              Evaluated {report.components.length} system dependencies in {report.durationMs}ms
            </p>
          </div>
        </div>
        <div>{getStatusBadge(report.overallStatus)}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {report.components.map((c, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-xl border ${
              c.status === 'HEALTHY'
                ? 'border-slate-800 bg-slate-950/40'
                : 'border-amber-900/60 bg-amber-950/20'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-white">{c.component}</h4>
              {getStatusBadge(c.status)}
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{c.durationMs}ms latency</span>
              </span>
              <span>•</span>
              <span>{c.dependencyInfo}</span>
            </div>

            {c.message && (
              <div className="mt-2 text-xs text-amber-300 bg-amber-950/40 p-2 rounded border border-amber-900/40">
                {c.message}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

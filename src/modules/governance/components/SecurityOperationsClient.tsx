'use client';

import React from 'react';
import { SecurityDashboardDto } from '../types';

interface Props {
  data: SecurityDashboardDto;
}

export default function SecurityOperationsClient({ data }: Props) {
  return (
    <div className="p-6 bg-[#09090B] text-slate-100 min-h-screen space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span>🔒</span> Security Operations & Event Monitoring
        </h1>
        <p className="text-xs text-slate-400 mt-1">Real-time security event log, secret exposure auditing & rate-limit monitoring.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-[#111113] border border-white/10 rounded-xl">
          <div className="text-xs text-slate-400">Total Security Events (24h)</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{data.totalEvents24h}</div>
        </div>
        <div className="p-4 bg-[#111113] border border-white/10 rounded-xl">
          <div className="text-xs text-slate-400">Critical Severity Events</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{data.criticalEventsCount}</div>
        </div>
        <div className="p-4 bg-[#111113] border border-white/10 rounded-xl">
          <div className="text-xs text-slate-400">Blocked Rate Limit Events</div>
          <div className="text-2xl font-bold text-sky-400 mt-1">{data.blockedRateLimitEventsCount}</div>
        </div>
        <div className="p-4 bg-[#111113] border border-white/10 rounded-xl">
          <div className="text-xs text-slate-400">Secret Exposure Attempts</div>
          <div className="text-2xl font-bold text-purple-400 mt-1">{data.secretExposureAttemptsCount}</div>
        </div>
      </div>

      <div className="bg-[#111113] border border-white/10 rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-white">Security Event Log (Scrubbed & Sanitized)</h2>
        <div className="divide-y divide-white/5 overflow-x-auto">
          {data.recentEvents.map((evt) => (
            <div key={evt.id} className="py-3 flex items-center justify-between text-xs min-w-[600px]">
              <div className="flex items-center gap-3">
                <span className="font-mono text-amber-400">{evt.eventCode}</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">{evt.eventType}</span>
                <span className="text-slate-300">{evt.action}</span>
              </div>
              <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
                <span>Result: {evt.result}</span>
                <span>CorrID: {evt.correlationId?.slice(0, 15)}...</span>
                <span>{new Date(evt.createdAt).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

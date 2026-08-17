'use client';

import React from 'react';

interface Props {
  telemetry: any;
}

export default function ObservabilityClient({ telemetry }: Props) {
  return (
    <div className="p-6 bg-[#09090B] text-slate-100 min-h-screen space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span>📊</span> System Observability & Telemetry Controls
        </h1>
        <p className="text-xs text-slate-400 mt-1">Cross-system health monitoring, latencies, error rates & throughput tracking across 14 components.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-[#111113] border border-white/10 rounded-xl">
          <div className="text-xs text-slate-400">Security Failures (24h)</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{telemetry.recentErrorsCount24h}</div>
        </div>
        <div className="p-4 bg-[#111113] border border-white/10 rounded-xl">
          <div className="text-xs text-slate-400">Rate Limit Blocks (24h)</div>
          <div className="text-2xl font-bold text-sky-400 mt-1">{telemetry.rateLimitBlocksCount24h}</div>
        </div>
      </div>

      <div className="bg-[#111113] border border-white/10 rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-white">System Metrics Feed</h2>
        {telemetry.recentMetrics?.length === 0 ? (
          <p className="text-xs text-slate-500 py-4">No recorded metrics telemetry available.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {telemetry.recentMetrics?.map((m: any) => (
              <div key={m.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono text-teal-400 mr-2">{m.metricCode}</span>
                  <span className="text-slate-300 font-semibold">{m.service}</span>
                  <span className="text-slate-400 ml-2">({m.metricType})</span>
                </div>
                <div className="font-mono font-bold text-white">
                  {m.value} {m.unit}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

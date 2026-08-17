'use client';

import React from 'react';
import Link from 'next/link';

interface Props {
  plans: any[];
}

export default function RecoveryPlanClient({ plans }: Props) {
  return (
    <div className="p-6 bg-[#09090B] text-slate-100 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>🔄</span> Disaster Recovery Plans & Runbooks
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Ordered, deterministic recovery plans with targeted RPO/RTO objectives and step dependencies.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/resilience/recovery/executions"
            className="px-4 py-2 text-xs font-medium bg-[#5B1111] hover:bg-[#7F1D1D] text-white rounded-lg transition"
          >
            Live Executions →
          </Link>
          <Link
            href="/resilience"
            className="px-4 py-2 text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition border border-white/10"
          >
            ← Overview
          </Link>
        </div>
      </div>

      {/* Plans List */}
      <div className="space-y-4">
        {plans.map(p => (
          <div key={p.id} className="p-5 bg-[#111113] border border-white/10 rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-200">{p.planCode}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                    p.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-500/20 text-slate-400'
                  }`}>
                    {p.status}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-purple-500/20 text-purple-300">
                    Scope: {p.scope}
                  </span>
                </div>
                <h2 className="text-base font-semibold text-white mt-1">{p.name}</h2>
                <p className="text-xs text-slate-400">{p.description || 'No description provided.'}</p>
              </div>
              <div className="text-right text-xs space-y-1">
                <div>Target RPO: <span className="font-semibold text-sky-400">{p.targetRpoMinutes} mins</span></div>
                <div>Target RTO: <span className="font-semibold text-amber-400">{p.targetRtoMinutes} mins</span></div>
              </div>
            </div>

            {/* Steps list */}
            <div>
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Recovery Steps ({p.steps?.length || 0})
              </h3>
              {p.steps?.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No recovery steps defined yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {p.steps?.map((s: any) => (
                    <div key={s.id} className="p-3 bg-white/5 border border-white/5 rounded-lg space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono text-slate-400">Step {s.stepNumber}</span>
                        <span className="px-1.5 py-0.5 text-[9px] bg-slate-700/50 rounded text-slate-300">
                          {s.stepType}
                        </span>
                      </div>
                      <div className="text-xs font-medium text-white">{s.name}</div>
                      <div className="text-[10px] text-slate-400">Timeout: {s.timeoutSeconds}s</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

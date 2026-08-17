'use client';

import React from 'react';
import Link from 'next/link';

interface Props {
  plans: any[];
}

export default function ContinuityPlanClient({ plans }: Props) {
  return (
    <div className="p-6 bg-[#09090B] text-slate-100 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>📋</span> Business Continuity Plans & Procedures
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Critical business function continuity, minimum operating levels, and responsible role mapping.
          </p>
        </div>
        <Link
          href="/resilience"
          className="px-4 py-2 text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition border border-white/10"
        >
          ← Back to Overview
        </Link>
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
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-amber-500/20 text-amber-300">
                    Criticality: {p.criticality}
                  </span>
                </div>
                <h2 className="text-base font-semibold text-white mt-1">{p.name}</h2>
                <p className="text-xs text-slate-400">Business Function: <span className="text-slate-200 font-medium">{p.businessFunction}</span></p>
              </div>
              <div className="text-right text-xs space-y-1">
                <div>Max Tolerable Downtime: <span className="font-semibold text-rose-400">{p.maximumTolerableDowntimeMinutes} mins</span></div>
                <div>Owner: <span className="text-slate-300">{p.owner?.name || 'Unassigned'}</span></div>
              </div>
            </div>

            {/* Procedures list */}
            <div>
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Continuity Procedures ({p.procedures?.length || 0})
              </h3>
              {p.procedures?.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No continuity procedures configured yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {p.procedures?.map((proc: any) => (
                    <div key={proc.id} className="p-3 bg-white/5 border border-white/5 rounded-lg space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono text-slate-400">Seq {proc.sequence}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{proc.procedureCode}</span>
                      </div>
                      <div className="text-xs font-medium text-white">{proc.name}</div>
                      <div className="text-[10px] text-slate-400">Role: <span className="text-slate-300">{proc.responsibleRole || 'Any Leader'}</span></div>
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

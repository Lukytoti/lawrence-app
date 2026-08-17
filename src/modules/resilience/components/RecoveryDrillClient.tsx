'use client';

import React from 'react';
import Link from 'next/link';

interface Props {
  drills: any[];
}

export default function RecoveryDrillClient({ drills }: Props) {
  return (
    <div className="p-6 bg-[#09090B] text-slate-100 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>🧪</span> Controlled Recovery Drills & Simulations
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Tabletop exercises, restore tests, failover drills, and full DR readiness evaluations without production mutation.
          </p>
        </div>
        <Link
          href="/resilience"
          className="px-4 py-2 text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition border border-white/10"
        >
          ← Back to Overview
        </Link>
      </div>

      {/* Drill Types Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {['DRY_RUN', 'TABLETOP', 'RESTORE_TEST', 'FAILOVER_TEST', 'FULL_RECOVERY_TEST'].map(type => (
          <div key={type} className="p-3 bg-[#111113] border border-white/10 rounded-xl text-center space-y-1">
            <div className="text-xs font-semibold text-white">{type.replace(/_/g, ' ')}</div>
            <div className="text-[10px] text-slate-400">Validated Exercise</div>
          </div>
        ))}
      </div>

      {/* Drills Table */}
      <div className="p-5 bg-[#111113] border border-white/10 rounded-xl space-y-4">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Executed Recovery Drills</h2>
        {drills.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No recovery drills executed yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-white/10 uppercase bg-white/5">
                <tr>
                  <th className="p-3">Drill Code</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Initiated By</th>
                  <th className="p-3">Started At</th>
                  <th className="p-3">Completed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {drills.map(d => (
                  <tr key={d.id} className="hover:bg-white/5 transition">
                    <td className="p-3 font-mono text-slate-200 font-bold">{d.executionCode}</td>
                    <td className="p-3 text-slate-300">{d.recoveryPlan?.name || '-'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                        d.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">{d.initiatedBy?.name || 'Automated Drill'}</td>
                    <td className="p-3 text-slate-400">{new Date(d.startedAt).toLocaleString()}</td>
                    <td className="p-3 text-slate-400">{d.completedAt ? new Date(d.completedAt).toLocaleString() : 'Running...'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

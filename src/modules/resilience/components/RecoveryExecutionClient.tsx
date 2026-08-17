'use client';

import React from 'react';
import Link from 'next/link';

interface Props {
  executions: any[];
}

export default function RecoveryExecutionClient({ executions }: Props) {
  return (
    <div className="p-6 bg-[#09090B] text-slate-100 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>⚡</span> Disaster Recovery Executions & Live Status
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time execution telemetry, step execution progression, and state transitions.
          </p>
        </div>
        <Link
          href="/resilience/recovery"
          className="px-4 py-2 text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition border border-white/10"
        >
          ← Recovery Plans
        </Link>
      </div>

      {/* Executions Table */}
      <div className="p-5 bg-[#111113] border border-white/10 rounded-xl space-y-4">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Execution History</h2>
        {executions.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No recovery executions initiated yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-white/10 uppercase bg-white/5">
                <tr>
                  <th className="p-3">Execution Code</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3">Trigger Type</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Current Step</th>
                  <th className="p-3">Initiated By</th>
                  <th className="p-3">Started At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {executions.map(e => (
                  <tr key={e.id} className="hover:bg-white/5 transition">
                    <td className="p-3 font-mono text-slate-200 font-bold">{e.executionCode}</td>
                    <td className="p-3 text-slate-300">{e.recoveryPlan?.name || '-'}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-purple-500/20 text-purple-300">
                        {e.triggerType}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                        e.status === 'COMPLETED'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : e.status === 'FAILED'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-400">
                      {e.currentStep !== null ? `Step ${e.currentStep}` : 'Complete'}
                    </td>
                    <td className="p-3 text-slate-400">{e.initiatedBy?.name || 'Automated / System'}</td>
                    <td className="p-3 text-slate-400">{new Date(e.startedAt).toLocaleString()}</td>
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

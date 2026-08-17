'use client';

import React from 'react';
import Link from 'next/link';

interface Props {
  executions: any[];
}

export function ExecutionListClient({ executions }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Execution Monitoring Workspace</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Historical workflow executions, step results, retries, and correlation IDs
          </p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-zinc-950 text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Idempotency Key / Workflow</th>
                <th className="py-3.5 px-4">Trigger Type</th>
                <th className="py-3.5 px-4">Started At</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
              {executions.map((ex) => (
                <tr key={ex.id} className="hover:bg-white/[0.02] transition">
                  <td className="py-4 px-4">
                    <div className="font-semibold text-white">{ex.workflow?.name || 'Workflow'}</div>
                    <div className="text-xs text-zinc-500 font-mono">{ex.idempotencyKey}</div>
                  </td>
                  <td className="py-4 px-4 text-xs font-mono text-amber-400">
                    {ex.triggerType} ({ex.triggerEvent || 'Direct'})
                  </td>
                  <td className="py-4 px-4 text-xs font-mono text-zinc-400">
                    {new Date(ex.startedAt).toLocaleString()}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        ex.status === 'COMPLETED'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : ex.status === 'FAILED'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {ex.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <Link
                      href={`/automation/executions/${ex.id}`}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs font-medium transition"
                    >
                      Timeline &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

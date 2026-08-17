'use client';

import React, { useState } from 'react';
import { updateRetentionCaseStatusAction } from '../actions';

interface Props {
  cases: any[];
  currentUserId: string;
}

export function RetentionCasesClient({ cases: initialCases, currentUserId }: Props) {
  const [cases, setCases] = useState(initialCases);

  const handleUpdateStatus = async (caseId: string, newStatus: any) => {
    try {
      await updateRetentionCaseStatusAction(currentUserId, caseId, newStatus);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Failed to update case status.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Retention Case Management</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Active churn prevention cases, risk factor investigations, and leadership interventions
          </p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-zinc-950 text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Severity</th>
                <th className="py-3.5 px-4">Reason / Risk</th>
                <th className="py-3.5 px-4">Assigned Owner</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
              {cases.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02] transition">
                  <td className="py-4 px-4 font-semibold text-white">
                    {c.client?.companyName || c.client?.contactName}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      c.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {c.severity}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-xs text-zinc-300 max-w-xs truncate">
                    {c.reason}
                  </td>
                  <td className="py-4 px-4 text-xs text-zinc-400">
                    {c.assignedOwner?.name || 'Unassigned'}
                  </td>
                  <td className="py-4 px-4 text-xs font-mono font-semibold text-white">
                    {c.status}
                  </td>
                  <td className="py-4 px-4 text-right space-x-2">
                    {c.status === 'OPEN' && (
                      <button
                        onClick={() => handleUpdateStatus(c.id, 'INVESTIGATING')}
                        className="px-2.5 py-1 bg-blue-900/40 hover:bg-blue-900/60 text-blue-300 rounded text-xs font-medium border border-blue-500/20"
                      >
                        Investigate
                      </button>
                    )}
                    {c.status !== 'RESOLVED' && c.status !== 'CHURNED' && (
                      <button
                        onClick={() => handleUpdateStatus(c.id, 'RESOLVED')}
                        className="px-2.5 py-1 bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-300 rounded text-xs font-medium border border-emerald-500/20"
                      >
                        Resolve Case
                      </button>
                    )}
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

'use client';

import React, { useState } from 'react';
import { updateRenewalStatusAction } from '../actions';

interface Props {
  renewals: any[];
  currentUserId: string;
}

export function RenewalWorkspaceClient({ renewals: initialRenewals, currentUserId }: Props) {
  const [renewals, setRenewals] = useState(initialRenewals);

  const handleUpdateStatus = async (renewalId: string, newStatus: any) => {
    try {
      await updateRenewalStatusAction(currentUserId, renewalId, newStatus);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Failed to update renewal status.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Contract Renewal Workspace</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Track 90/60/30/14/7-day expiring client contract renewals and negotiations
          </p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-zinc-950 text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Client / Contract</th>
                <th className="py-3.5 px-4">Expiration Window</th>
                <th className="py-3.5 px-4">Target Date</th>
                <th className="py-3.5 px-4">Proposed Value</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
              {renewals.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.02] transition">
                  <td className="py-4 px-4">
                    <div className="font-semibold text-white">
                      {r.client?.companyName || r.client?.contactName}
                    </div>
                    <div className="text-xs text-zinc-500">{r.contract?.title}</div>
                  </td>
                  <td className="py-4 px-4 font-mono text-xs text-amber-400 font-semibold">
                    {r.expirationWindowDays} Days Window
                  </td>
                  <td className="py-4 px-4 text-xs font-mono text-zinc-400">
                    {new Date(r.targetRenewalDate).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4 font-mono font-semibold text-white">
                    {r.currency} {Number(r.proposedValue).toLocaleString()}
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-0.5 bg-zinc-800 border border-white/10 rounded text-xs font-semibold text-zinc-200">
                      {r.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right space-x-2">
                    {r.status === 'UPCOMING' && (
                      <button
                        onClick={() => handleUpdateStatus(r.id, 'OUTREACH')}
                        className="px-2.5 py-1 bg-blue-900/40 hover:bg-blue-900/60 text-blue-300 rounded text-xs font-medium border border-blue-500/20"
                      >
                        Start Outreach
                      </button>
                    )}
                    {r.status === 'OUTREACH' && (
                      <button
                        onClick={() => handleUpdateStatus(r.id, 'NEGOTIATION')}
                        className="px-2.5 py-1 bg-amber-900/40 hover:bg-amber-900/60 text-amber-300 rounded text-xs font-medium border border-amber-500/20"
                      >
                        Negotiating
                      </button>
                    )}
                    {(r.status === 'OUTREACH' || r.status === 'NEGOTIATION') && (
                      <button
                        onClick={() => handleUpdateStatus(r.id, 'RENEWED')}
                        className="px-2.5 py-1 bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-300 rounded text-xs font-medium border border-emerald-500/20"
                      >
                        Mark Renewed
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

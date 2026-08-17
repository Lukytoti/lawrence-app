'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface ClientItem {
  clientId: string;
  clientCode: string;
  companyName: string;
  healthStatus: string;
  healthScore: number;
  activeContractTitle: string;
  contractEndDate: Date | string | null;
  overdueInvoicesCount: number;
  projectCount: number;
  openCasesCount: number;
  renewalStatus: string;
}

interface Props {
  clients: ClientItem[];
}

export function ClientSuccessListClient({ clients }: Props) {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filtered = clients.filter((c) => {
    if (filterStatus === 'ALL') return true;
    return c.healthStatus === filterStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Client Health & Success</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Explainable client health states, risk factors, and contract statuses
          </p>
        </div>
        <div className="flex items-center gap-2">
          {['ALL', 'HEALTHY', 'STABLE', 'AT_RISK', 'CRITICAL'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                filterStatus === status
                  ? 'bg-burgundy-900 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-zinc-900 border border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-zinc-950 text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Health Status</th>
                <th className="py-3.5 px-4">Score</th>
                <th className="py-3.5 px-4">Active Contract</th>
                <th className="py-3.5 px-4">Overdue Invoices</th>
                <th className="py-3.5 px-4">Projects</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
              {filtered.map((c) => {
                let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                if (c.healthStatus === 'STABLE') badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                if (c.healthStatus === 'AT_RISK') badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                if (c.healthStatus === 'CRITICAL' || c.healthStatus === 'CHURNED') badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';

                return (
                  <tr key={c.clientId} className="hover:bg-white/[0.02] transition">
                    <td className="py-4 px-4">
                      <div className="font-semibold text-white">{c.companyName}</div>
                      <div className="text-xs text-zinc-500">{c.clientCode}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeColor}`}>
                        {c.healthStatus}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-white">
                      {c.healthScore} / 100
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-zinc-200 text-xs font-medium">{c.activeContractTitle}</div>
                      {c.contractEndDate && (
                        <div className="text-xs text-zinc-500">
                          Expires: {new Date(c.contractEndDate).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 font-mono">
                      {c.overdueInvoicesCount > 0 ? (
                        <span className="text-rose-400 font-semibold">{c.overdueInvoicesCount} Overdue</span>
                      ) : (
                        <span className="text-zinc-500">0 Overdue</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-xs font-mono text-zinc-400">
                      {c.projectCount} Project(s)
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        href={`/retention/clients/${c.clientId}`}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs font-medium transition"
                      >
                        Retention Cockpit &rarr;
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

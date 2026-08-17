'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface Props {
  plans: any[];
  executions: any[];
}

export default function BackupDashboardClient({ plans, executions }: Props) {
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const filteredPlans = selectedType === 'ALL'
    ? plans
    : plans.filter(p => p.backupType === selectedType);

  return (
    <div className="p-6 bg-[#09090B] text-slate-100 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>💾</span> Backup Governance & Execution Hub
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Automated backups, verification statuses, integrity checks, and retention lifecycle monitoring.
          </p>
        </div>
        <Link
          href="/resilience"
          className="px-4 py-2 text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition border border-white/10"
        >
          ← Back to Overview
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-3">
        {['ALL', 'FULL', 'INCREMENTAL', 'SNAPSHOT', 'CONFIGURATION'].map(type => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              selectedType === type ? 'bg-[#5B1111] text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Plans Section */}
      <div className="p-5 bg-[#111113] border border-white/10 rounded-xl space-y-4">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Configured Backup Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlans.map(p => (
            <div key={p.id} className="p-4 bg-white/5 border border-white/5 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-200">{p.planCode}</span>
                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                  p.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-500/20 text-slate-400'
                }`}>
                  {p.isActive ? 'ACTIVE' : 'PAUSED'}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">{p.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{p.description || 'No description provided.'}</p>
              </div>
              <div className="text-[11px] text-slate-400 space-y-1 border-t border-white/5 pt-2">
                <div>Type: <span className="text-sky-400 font-semibold">{p.backupType}</span></div>
                <div>Frequency: <span className="text-slate-200">{p.frequency}</span></div>
                <div>Retention: <span className="text-slate-200">{p.retentionDays} days</span></div>
                <div>Encryption: <span className={p.encryptionRequired ? 'text-emerald-400' : 'text-rose-400'}>{p.encryptionRequired ? 'Required' : 'Disabled'}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Executions Table */}
      <div className="p-5 bg-[#111113] border border-white/10 rounded-xl space-y-4">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Backup Executions History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 border-b border-white/10 uppercase bg-white/5">
              <tr>
                <th className="p-3">Execution Code</th>
                <th className="p-3">Plan</th>
                <th className="p-3">Status</th>
                <th className="p-3">Verification</th>
                <th className="p-3">Checksum</th>
                <th className="p-3">Started At</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {executions.map(e => (
                <tr key={e.id} className="hover:bg-white/5 transition">
                  <td className="p-3 font-mono text-slate-200">{e.executionCode}</td>
                  <td className="p-3 text-slate-300">{e.backupPlan?.name || '-'}</td>
                  <td className="p-3 font-semibold text-emerald-400">{e.status}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                      e.verificationStatus === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {e.verificationStatus}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-[10px] text-slate-400">{e.checksum ? `${e.checksum.substring(0, 16)}...` : '-'}</td>
                  <td className="p-3 text-slate-400">{new Date(e.startedAt).toLocaleString()}</td>
                  <td className="p-3">
                    <Link href={`/resilience/backups/${e.id}`} className="text-rose-400 hover:underline">
                      Inspect →
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

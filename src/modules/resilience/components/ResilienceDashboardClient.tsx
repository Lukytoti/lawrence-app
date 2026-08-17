'use client';

import React, { useState } from 'react';
import { ResilienceDashboardDto } from '../types';
import Link from 'next/link';

interface Props {
  data: ResilienceDashboardDto;
}

export default function ResilienceDashboardClient({ data }: Props) {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'BACKUPS' | 'RECOVERIES'>('OVERVIEW');

  return (
    <div className="p-6 bg-[#09090B] text-slate-100 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="text-rose-500">🛡️</span> Platform Resilience & Business Continuity Engine
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Backup governance, disaster recovery execution, RPO/RTO compliance, and operational continuity mapping.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full border ${
              data.rpoCompliance && data.rtoCompliance
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
          >
            Objectives: {data.rpoCompliance && data.rtoCompliance ? 'COMPLIANT' : 'AT RISK'}
          </span>
          <Link
            href="/admin/resilience"
            className="px-4 py-2 text-xs font-medium bg-[#5B1111] hover:bg-[#7F1D1D] text-white rounded-lg transition-colors border border-rose-800/40"
          >
            Admin Controls
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-[#111113] border border-white/10 rounded-xl space-y-2">
          <div className="text-xs text-slate-400 uppercase font-medium">Backup Plans</div>
          <div className="text-2xl font-bold text-sky-400">{data.activeBackupPlans} / {data.totalBackupPlans}</div>
          <p className="text-[11px] text-slate-500">Active backup schedules</p>
        </div>

        <div className="p-4 bg-[#111113] border border-white/10 rounded-xl space-y-2">
          <div className="text-xs text-slate-400 uppercase font-medium">Recovery Plans</div>
          <div className="text-2xl font-bold text-purple-400">{data.activeRecoveryPlans} / {data.totalRecoveryPlans}</div>
          <p className="text-[11px] text-slate-500">Active DR runbooks</p>
        </div>

        <div className="p-4 bg-[#111113] border border-white/10 rounded-xl space-y-2">
          <div className="text-xs text-slate-400 uppercase font-medium">Service Dependencies</div>
          <div className="text-2xl font-bold text-amber-400">{data.activeDependencies} / {data.totalDependencies}</div>
          <p className="text-[11px] text-slate-500">Monitored system dependencies</p>
        </div>

        <div className="p-4 bg-[#111113] border border-white/10 rounded-xl space-y-2">
          <div className="text-xs text-slate-400 uppercase font-medium">Open Incidents</div>
          <div className={`text-2xl font-bold ${data.openIncidents > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {data.openIncidents}
          </div>
          <p className="text-[11px] text-slate-500">{data.criticalIncidents} critical severity</p>
        </div>
      </div>

      {/* Quick Links Navigation Bar */}
      <div className="flex flex-wrap gap-2 p-3 bg-[#111113] border border-white/10 rounded-xl">
        <Link href="/resilience/backups" className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 transition">
          💾 Backups
        </Link>
        <Link href="/resilience/recovery" className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 transition">
          🔄 Recovery Plans
        </Link>
        <Link href="/resilience/continuity" className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 transition">
          📋 Business Continuity
        </Link>
        <Link href="/resilience/dependencies" className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 transition">
          🗺️ Dependencies
        </Link>
        <Link href="/resilience/incidents" className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 transition">
          🚨 Incidents
        </Link>
        <Link href="/resilience/drills" className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 transition">
          🧪 Recovery Drills
        </Link>
        <Link href="/resilience/audit" className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 transition">
          📜 Audit Trail
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
            activeTab === 'OVERVIEW' ? 'bg-[#5B1111] text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
          }`}
        >
          Recent Activity
        </button>
        <button
          onClick={() => setActiveTab('BACKUPS')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
            activeTab === 'BACKUPS' ? 'bg-[#5B1111] text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
          }`}
        >
          Latest Backups ({data.recentBackups?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('RECOVERIES')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
            activeTab === 'RECOVERIES' ? 'bg-[#5B1111] text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
          }`}
        >
          Latest Recoveries ({data.recentRecoveries?.length || 0})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Backups Summary */}
          <div className="p-5 bg-[#111113] border border-white/10 rounded-xl space-y-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Latest Backup Executions</h2>
            {data.recentBackups?.length === 0 ? (
              <p className="text-xs text-slate-500">No backup executions recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {data.recentBackups?.map((b: any) => (
                  <div key={b.id} className="p-3 bg-white/5 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="text-xs font-mono text-slate-200">{b.executionCode}</div>
                      <div className="text-[11px] text-slate-400">{b.backupPlan?.name || 'Manual Backup'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                        b.verificationStatus === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {b.verificationStatus}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                        b.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {b.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recoveries Summary */}
          <div className="p-5 bg-[#111113] border border-white/10 rounded-xl space-y-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Latest Recovery Executions</h2>
            {data.recentRecoveries?.length === 0 ? (
              <p className="text-xs text-slate-500">No recovery executions recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {data.recentRecoveries?.map((r: any) => (
                  <div key={r.id} className="p-3 bg-white/5 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="text-xs font-mono text-slate-200">{r.executionCode}</div>
                      <div className="text-[11px] text-slate-400">{r.recoveryPlan?.name || 'Manual Plan'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-purple-500/20 text-purple-300">
                        {r.triggerType}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                        r.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'BACKUPS' && (
        <div className="p-5 bg-[#111113] border border-white/10 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">All Recent Backups</h2>
            <Link href="/resilience/backups" className="text-xs text-rose-400 hover:underline">View Full Backup Console →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-white/10 uppercase bg-white/5">
                <tr>
                  <th className="p-3">Execution Code</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Verification</th>
                  <th className="p-3">Started At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.recentBackups?.map((b: any) => (
                  <tr key={b.id} className="hover:bg-white/5 transition">
                    <td className="p-3 font-mono text-slate-200">{b.executionCode}</td>
                    <td className="p-3 text-slate-300">{b.backupPlan?.name}</td>
                    <td className="p-3 font-semibold text-emerald-400">{b.status}</td>
                    <td className="p-3">{b.verificationStatus}</td>
                    <td className="p-3 text-slate-400">{new Date(b.startedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'RECOVERIES' && (
        <div className="p-5 bg-[#111113] border border-white/10 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">All Recent Recoveries</h2>
            <Link href="/resilience/recovery" className="text-xs text-rose-400 hover:underline">View Full Recovery Console →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-white/10 uppercase bg-white/5">
                <tr>
                  <th className="p-3">Execution Code</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3">Trigger</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Initiated By</th>
                  <th className="p-3">Started At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.recentRecoveries?.map((r: any) => (
                  <tr key={r.id} className="hover:bg-white/5 transition">
                    <td className="p-3 font-mono text-slate-200">{r.executionCode}</td>
                    <td className="p-3 text-slate-300">{r.recoveryPlan?.name}</td>
                    <td className="p-3 text-purple-400">{r.triggerType}</td>
                    <td className="p-3 font-semibold text-amber-400">{r.status}</td>
                    <td className="p-3 text-slate-400">{r.initiatedBy?.name || 'System'}</td>
                    <td className="p-3 text-slate-400">{new Date(r.startedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

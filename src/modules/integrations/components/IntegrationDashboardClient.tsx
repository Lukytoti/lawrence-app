'use client';

import React, { useState } from 'react';
import { IntegrationDashboardDto } from '../types';
import Link from 'next/link';

interface Props {
  data: IntegrationDashboardDto;
}

export default function IntegrationDashboardClient({ data }: Props) {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'LOGS' | 'HEALTH'>('OVERVIEW');

  return (
    <div className="p-6 bg-[#09090B] text-slate-100 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="text-sky-500">🔌</span> Integration & API Gateway Engine
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Enterprise connectivity, inbound/outbound webhooks, dead-letter queue & API request gateway.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${
            data.overallHealthStatus === 'HEALTHY'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
            Health: {data.overallHealthStatus}
          </span>
          <Link
            href="/admin/integrations"
            className="px-4 py-2 text-xs font-medium bg-[#5B1111] hover:bg-[#7F1D1D] text-white rounded-lg transition-colors border border-rose-800/40"
          >
            Integration Admin Controls
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 bg-[#111113] border border-white/10 rounded-xl space-y-2">
          <div className="text-xs text-slate-400 uppercase font-medium">Total Integrations</div>
          <div className="text-2xl font-bold text-white">{data.totalIntegrations}</div>
          <p className="text-[11px] text-slate-500">Registered external systems</p>
        </div>

        <div className="p-4 bg-[#111113] border border-white/10 rounded-xl space-y-2">
          <div className="text-xs text-slate-400 uppercase font-medium">Active Integrations</div>
          <div className="text-2xl font-bold text-emerald-400">{data.activeIntegrationsCount}</div>
          <p className="text-[11px] text-slate-500">Currently active adapters</p>
        </div>

        <div className="p-4 bg-[#111113] border border-white/10 rounded-xl space-y-2">
          <div className="text-xs text-slate-400 uppercase font-medium">Active Connections</div>
          <div className="text-2xl font-bold text-sky-400">{data.activeConnectionsCount}</div>
          <p className="text-[11px] text-slate-500">Environment connections</p>
        </div>

        <div className="p-4 bg-[#111113] border border-white/10 rounded-xl space-y-2">
          <div className="text-xs text-slate-400 uppercase font-medium">Pending Jobs</div>
          <div className="text-2xl font-bold text-amber-400">{data.pendingJobsCount}</div>
          <p className="text-[11px] text-slate-500">Scheduled sync tasks</p>
        </div>

        <div className="p-4 bg-[#111113] border border-white/10 rounded-xl space-y-2">
          <div className="text-xs text-slate-400 uppercase font-medium">Dead Letters</div>
          <div className="text-2xl font-bold text-rose-400">{data.deadLetterEventsCount}</div>
          <p className="text-[11px] text-slate-500">Failed event DLQ count</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`pb-3 transition-colors ${activeTab === 'OVERVIEW' ? 'text-sky-400 border-b-2 border-sky-400' : 'hover:text-slate-200'}`}
        >
          Quick Navigation
        </button>
        <button
          onClick={() => setActiveTab('LOGS')}
          className={`pb-3 transition-colors ${activeTab === 'LOGS' ? 'text-sky-400 border-b-2 border-sky-400' : 'hover:text-slate-200'}`}
        >
          Recent Integration Logs ({data.recentLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('HEALTH')}
          className={`pb-3 transition-colors ${activeTab === 'HEALTH' ? 'text-sky-400 border-b-2 border-sky-400' : 'hover:text-slate-200'}`}
        >
          Active Health Telemetry ({data.activeHealths.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-[#111113] border border-white/10 rounded-xl p-5">
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-white">Integration Engine Workspaces</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link href="/integrations/providers" className="p-4 bg-[#18181B] hover:bg-[#202024] rounded-lg border border-white/5 transition-all">
                <div className="text-sm font-semibold text-sky-400">🔌 Integrations Catalog</div>
                <p className="text-xs text-slate-400 mt-1">Manage external provider registries and adapters.</p>
              </Link>
              <Link href="/integrations/connections" className="p-4 bg-[#18181B] hover:bg-[#202024] rounded-lg border border-white/5 transition-all">
                <div className="text-sm font-semibold text-emerald-400">🔑 Connections & Auth</div>
                <p className="text-xs text-slate-400 mt-1">API Key, OAuth 2.0 and credential reference management.</p>
              </Link>
              <Link href="/integrations/webhooks" className="p-4 bg-[#18181B] hover:bg-[#202024] rounded-lg border border-white/5 transition-all">
                <div className="text-sm font-semibold text-purple-400">⚡ Webhook Gateway</div>
                <p className="text-xs text-slate-400 mt-1">Inbound/Outbound webhooks & signature verification.</p>
              </Link>
              <Link href="/integrations/mappings" className="p-4 bg-[#18181B] hover:bg-[#202024] rounded-lg border border-white/5 transition-all">
                <div className="text-sm font-semibold text-amber-400">🔄 Field Mappings</div>
                <p className="text-xs text-slate-400 mt-1">Entity payload transformation & renaming rules.</p>
              </Link>
              <Link href="/integrations/jobs" className="p-4 bg-[#18181B] hover:bg-[#202024] rounded-lg border border-white/5 transition-all">
                <div className="text-sm font-semibold text-teal-400">⏱️ Sync Jobs</div>
                <p className="text-xs text-slate-400 mt-1">Scheduled synchronization tasks & exponential backoff.</p>
              </Link>
              <Link href="/integrations/dead-letters" className="p-4 bg-[#18181B] hover:bg-[#202024] rounded-lg border border-white/5 transition-all">
                <div className="text-sm font-semibold text-rose-400">☠️ Dead-Letter Queue</div>
                <p className="text-xs text-slate-400 mt-1">Inspect, retry, or discard failed integration events.</p>
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'LOGS' && (
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-white">Sanitized Gateway Execution Logs</h3>
            {data.recentLogs.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">No integration logs recorded yet.</p>
            ) : (
              <div className="divide-y divide-white/5">
                {data.recentLogs.map((log) => (
                  <div key={log.id} className="py-3 flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[10px] mr-2 font-bold ${
                        log.level === 'ERROR' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-300'
                      }`}>
                        [{log.level}]
                      </span>
                      <span className="text-slate-200">{log.message}</span>
                    </div>
                    <span className="text-slate-500">{new Date(log.createdAt).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'HEALTH' && (
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-white">Connection Health Telemetry</h3>
            {data.activeHealths.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">No telemetry checks recorded.</p>
            ) : (
              <div className="divide-y divide-white/5">
                {data.activeHealths.map((h) => (
                  <div key={h.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-200 mr-2">[{h.status}]</span>
                      <span className="text-slate-400">Latency: {h.latencyMs || 0}ms</span>
                    </div>
                    <span className="text-slate-500">{new Date(h.lastCheckedAt).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

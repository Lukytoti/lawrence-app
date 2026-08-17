'use client';

import React, { useState } from 'react';
import { GovernanceDashboardDto } from '../types';
import Link from 'next/link';

interface Props {
  data: GovernanceDashboardDto;
}

export default function GovernanceDashboardClient({ data }: Props) {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'EVENTS' | 'INCIDENTS' | 'RISKS'>('OVERVIEW');

  return (
    <div className="p-6 bg-[#09090B] text-slate-100 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="text-amber-500">🛡️</span> Platform Governance & Security Operations Hub
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Enterprise security event monitoring, incident management, access governance, compliance & observability controls.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${
            data.overallSystemHealth === 'HEALTHY'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
            System Health: {data.overallSystemHealth}
          </span>
          <Link
            href="/admin/governance"
            className="px-4 py-2 text-xs font-medium bg-[#5B1111] hover:bg-[#7F1D1D] text-white rounded-lg transition-colors border border-rose-800/40"
          >
            Admin Governance Controls
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-[#111113] border border-white/10 rounded-xl space-y-2">
          <div className="text-xs text-slate-400 uppercase font-medium">Security Events (Today)</div>
          <div className="text-2xl font-bold text-amber-400">{data.totalSecurityEventsToday}</div>
          <p className="text-[11px] text-slate-500">Audited security events recorded</p>
        </div>

        <div className="p-4 bg-[#111113] border border-white/10 rounded-xl space-y-2">
          <div className="text-xs text-slate-400 uppercase font-medium">Open Incidents</div>
          <div className="text-2xl font-bold text-rose-400">{data.openIncidentsCount}</div>
          <p className="text-[11px] text-slate-500">Active incidents requiring action</p>
        </div>

        <div className="p-4 bg-[#111113] border border-white/10 rounded-xl space-y-2">
          <div className="text-xs text-slate-400 uppercase font-medium">Compliance Score</div>
          <div className="text-2xl font-bold text-emerald-400">{data.complianceScorePercentage}%</div>
          <p className="text-[11px] text-slate-500">{data.activeComplianceControlsCount} active internal controls</p>
        </div>

        <div className="p-4 bg-[#111113] border border-white/10 rounded-xl space-y-2">
          <div className="text-xs text-slate-400 uppercase font-medium">Active Security Risks</div>
          <div className="text-2xl font-bold text-purple-400">{data.openRisksCount}</div>
          <p className="text-[11px] text-slate-500">Risk register open items</p>
        </div>
      </div>

      {/* Governance Tabs */}
      <div className="flex border-b border-white/10 gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`pb-3 transition-colors ${activeTab === 'OVERVIEW' ? 'text-amber-400 border-b-2 border-amber-400' : 'hover:text-slate-200'}`}
        >
          Executive Overview
        </button>
        <button
          onClick={() => setActiveTab('EVENTS')}
          className={`pb-3 transition-colors ${activeTab === 'EVENTS' ? 'text-amber-400 border-b-2 border-amber-400' : 'hover:text-slate-200'}`}
        >
          Recent Security Events ({data.recentSecurityEvents.length})
        </button>
        <button
          onClick={() => setActiveTab('INCIDENTS')}
          className={`pb-3 transition-colors ${activeTab === 'INCIDENTS' ? 'text-amber-400 border-b-2 border-amber-400' : 'hover:text-slate-200'}`}
        >
          Active Incidents ({data.activeIncidents.length})
        </button>
        <button
          onClick={() => setActiveTab('RISKS')}
          className={`pb-3 transition-colors ${activeTab === 'RISKS' ? 'text-amber-400 border-b-2 border-amber-400' : 'hover:text-slate-200'}`}
        >
          Urgent Risks ({data.urgentRisks.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-[#111113] border border-white/10 rounded-xl p-5">
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-white">Platform Governance Quick Navigation</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link href="/governance/security" className="p-4 bg-[#18181B] hover:bg-[#202024] rounded-lg border border-white/5 transition-all">
                <div className="text-sm font-semibold text-amber-400">🔒 Security Operations</div>
                <p className="text-xs text-slate-400 mt-1">Real-time security event log, rate-limiting & secret audit.</p>
              </Link>
              <Link href="/governance/incidents" className="p-4 bg-[#18181B] hover:bg-[#202024] rounded-lg border border-white/5 transition-all">
                <div className="text-sm font-semibold text-rose-400">🚨 Incident Response Center</div>
                <p className="text-xs text-slate-400 mt-1">Security & operational incident lifecycle management.</p>
              </Link>
              <Link href="/governance/access-reviews" className="p-4 bg-[#18181B] hover:bg-[#202024] rounded-lg border border-white/5 transition-all">
                <div className="text-sm font-semibold text-sky-400">🔑 Access Reviews</div>
                <p className="text-xs text-slate-400 mt-1">Periodic RBAC permission review & privilege governance.</p>
              </Link>
              <Link href="/governance/compliance" className="p-4 bg-[#18181B] hover:bg-[#202024] rounded-lg border border-white/5 transition-all">
                <div className="text-sm font-semibold text-emerald-400">📋 Compliance Dashboard</div>
                <p className="text-xs text-slate-400 mt-1">SOC2, ISO27001, GDPR & Internal control evidence tracking.</p>
              </Link>
              <Link href="/governance/risks" className="p-4 bg-[#18181B] hover:bg-[#202024] rounded-lg border border-white/5 transition-all">
                <div className="text-sm font-semibold text-purple-400">⚠️ Risk Register</div>
                <p className="text-xs text-slate-400 mt-1">Security risk matrix, likelihood × impact scoring.</p>
              </Link>
              <Link href="/governance/observability" className="p-4 bg-[#18181B] hover:bg-[#202024] rounded-lg border border-white/5 transition-all">
                <div className="text-sm font-semibold text-teal-400">📊 System Observability</div>
                <p className="text-xs text-slate-400 mt-1">Service health metrics, error rates & latency telemetry.</p>
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'EVENTS' && (
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-white">Latest Security Events</h3>
            {data.recentSecurityEvents.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">No security events recorded yet.</p>
            ) : (
              <div className="divide-y divide-white/5">
                {data.recentSecurityEvents.map((evt) => (
                  <div key={evt.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono text-slate-400 mr-2">{evt.eventCode}</span>
                      <span className="font-semibold text-slate-200 mr-2">[{evt.eventType}]</span>
                      <span className="text-slate-400">{evt.action} ({evt.result})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                        {evt.severity}
                      </span>
                      <span className="text-slate-500">{new Date(evt.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'INCIDENTS' && (
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-white">Active Security Incidents</h3>
            {data.activeIncidents.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">Zero active security incidents.</p>
            ) : (
              <div className="divide-y divide-white/5">
                {data.activeIncidents.map((inc) => (
                  <div key={inc.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono text-rose-400 font-semibold mr-2">{inc.incidentCode}</span>
                      <span className="font-medium text-slate-200">{inc.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 font-semibold">
                        {inc.status}
                      </span>
                      <span className="text-slate-500">{new Date(inc.detectedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'RISKS' && (
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-white">Urgent Security Risks</h3>
            {data.urgentRisks.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">No high-score security risks active.</p>
            ) : (
              <div className="divide-y divide-white/5">
                {data.urgentRisks.map((r) => (
                  <div key={r.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono text-purple-400 font-semibold mr-2">{r.riskCode}</span>
                      <span className="font-medium text-slate-200">{r.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 font-mono">
                        Score: {r.riskScore} ({r.severity})
                      </span>
                    </div>
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

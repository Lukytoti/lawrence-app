'use client';

import React from 'react';
import {
  AlertTriangle,
  Award,
  TrendingUp,
  Users,
  Shield,
  CheckCircle,
  Activity,
} from 'lucide-react';

interface LeadershipAnalyticsClientProps {
  attentionAlerts: any[];
}

export function LeadershipAnalyticsClient({ attentionAlerts }: LeadershipAnalyticsClientProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 border border-white/10 p-6 rounded-xl backdrop-blur-md">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Activity className="w-6 h-6 text-rose-500" />
          Leadership Engagement & Attention Cockpit
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitor community participation rates, explainable engagement factors, and actionable member attention alerts.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-900/70 border border-white/10 p-5 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Members Needing Attention</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-white">{attentionAlerts.length}</p>
          <span className="text-[10px] text-amber-400 font-mono">Actionable Leadership Alerts</span>
        </div>

        <div className="bg-slate-900/70 border border-white/10 p-5 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Avg Engagement Score</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">82 / 100</p>
          <span className="text-[10px] text-emerald-400 font-mono">+14% vs Previous Period</span>
        </div>

        <div className="bg-slate-900/70 border border-white/10 p-5 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Training Velocity</span>
            <Award className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">94%</p>
          <span className="text-[10px] text-rose-400 font-mono">On-Time Completion Rate</span>
        </div>
      </div>

      {/* Attention Alerts List */}
      <div className="bg-slate-900/70 border border-white/10 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Members Requiring Leadership Attention
        </h2>

        {attentionAlerts.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 bg-slate-950/40 rounded-lg">
            No active leadership attention alerts. All organization members are actively engaged.
          </div>
        ) : (
          <div className="space-y-3">
            {attentionAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-slate-950/60 border border-amber-900/30 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{alert.memberName}</span>
                    <span className="text-[10px] font-mono text-slate-400">({alert.memberCode})</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                        alert.riskLevel === 'CRITICAL'
                          ? 'bg-red-950 text-red-300 border border-red-800/60'
                          : alert.riskLevel === 'HIGH'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {alert.riskLevel} RISK
                    </span>
                  </div>
                  <ul className="text-xs text-slate-300 mt-2 list-disc list-inside space-y-0.5">
                    {alert.reasons?.map((reason: string, idx: number) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>

                <a
                  href={`/network/members/${alert.memberId}`}
                  className="px-3 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-xs font-semibold text-white whitespace-nowrap self-start sm:self-center"
                >
                  View Profile Cockpit
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { ComplianceDashboardDto } from '../types';

interface Props {
  data: ComplianceDashboardDto;
}

export default function ComplianceDashboardClient({ data }: Props) {
  return (
    <div className="p-6 bg-[#09090B] text-slate-100 min-h-screen space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span>📋</span> Compliance Control Registry & Evidence Tracking
        </h1>
        <p className="text-xs text-slate-400 mt-1">Internal controls for SOC2, ISO27001, GDPR & Internal security standards.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-[#111113] border border-white/10 rounded-xl">
          <div className="text-xs text-slate-400">Total Controls</div>
          <div className="text-2xl font-bold text-white mt-1">{data.totalControls}</div>
        </div>
        <div className="p-4 bg-[#111113] border border-white/10 rounded-xl">
          <div className="text-xs text-slate-400">Active Controls</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{data.activeControls}</div>
        </div>
        <div className="p-4 bg-[#111113] border border-white/10 rounded-xl">
          <div className="text-xs text-slate-400">At-Risk Controls</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{data.atRiskControls}</div>
        </div>
        <div className="p-4 bg-[#111113] border border-white/10 rounded-xl">
          <div className="text-xs text-slate-400">Compliance Score</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{data.complianceScorePercentage}%</div>
        </div>
      </div>

      <div className="bg-[#111113] border border-white/10 rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-white">Compliance Evidence Log</h2>
        <div className="divide-y divide-white/5">
          {data.recentEvidences.map((ev) => (
            <div key={ev.id} className="py-3 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-slate-200 mr-2">[{ev.evidenceType}]</span>
                <span className="text-slate-400">{ev.reference}</span>
              </div>
              <span className="text-slate-500">{new Date(ev.collectedAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

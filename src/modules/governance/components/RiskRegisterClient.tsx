'use client';

import React from 'react';

interface Props {
  risks: any[];
}

export default function RiskRegisterClient({ risks }: Props) {
  return (
    <div className="p-6 bg-[#09090B] text-slate-100 min-h-screen space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span>⚠️</span> Security Risk Register & Scoring Matrix
        </h1>
        <p className="text-xs text-slate-400 mt-1">Calculated risk score matrix (riskScore = likelihood × impact), mitigation plans & owner assignment.</p>
      </div>

      <div className="bg-[#111113] border border-white/10 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">Active Risks ({risks.length})</h2>
        {risks.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">No active security risks registered.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {risks.map((r) => (
              <div key={r.id} className="py-4 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-purple-400 font-bold">{r.riskCode}</span>
                    <span className="font-semibold text-white text-sm">{r.title}</span>
                  </div>
                  <p className="text-slate-400 mt-1">{r.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 font-bold text-[10px]">
                    Score: {r.riskScore} (L:{r.likelihood} × I:{r.impact})
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

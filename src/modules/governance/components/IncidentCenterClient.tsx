'use client';

import React from 'react';

interface Props {
  incidents: any[];
}

export default function IncidentCenterClient({ incidents }: Props) {
  return (
    <div className="p-6 bg-[#09090B] text-slate-100 min-h-screen space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span>🚨</span> Security & Operational Incident Response Center
        </h1>
        <p className="text-xs text-slate-400 mt-1">Incident lifecycle management: OPEN → ACKNOWLEDGED → INVESTIGATING → CONTAINED → RESOLVED → CLOSED.</p>
      </div>

      <div className="bg-[#111113] border border-white/10 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">Incident Registry ({incidents.length})</h2>
        {incidents.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">No active security incidents recorded.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {incidents.map((inc) => (
              <div key={inc.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-rose-400 font-bold">{inc.incidentCode}</span>
                    <span className="font-semibold text-white text-sm">{inc.title}</span>
                  </div>
                  <p className="text-slate-400 mt-1">{inc.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px]">
                    {inc.status}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                    {inc.severity}
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

'use client';

import React from 'react';

interface Props {
  integrations: any[];
}

export default function IntegrationListClient({ integrations }: Props) {
  return (
    <div className="p-6 bg-[#09090B] text-slate-100 min-h-screen space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span>🔌</span> Integration Providers & Adapters Catalog
        </h1>
        <p className="text-xs text-slate-400 mt-1">Registered external system integrations and provider protocols.</p>
      </div>

      <div className="bg-[#111113] border border-white/10 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">Registered Providers ({integrations.length})</h2>
        {integrations.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">No integration providers registered yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((it) => (
              <div key={it.id} className="p-4 bg-[#18181B] rounded-lg border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{it.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                    {it.category}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{it.description || 'No description provided.'}</p>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-2 border-t border-white/5">
                  <span>Code: {it.integrationCode}</span>
                  <span className="text-emerald-400">{it.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

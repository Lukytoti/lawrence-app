'use client';

import React from 'react';

interface Props {
  connections: any[];
}

export default function ConnectionListClient({ connections }: Props) {
  return (
    <div className="p-6 bg-[#09090B] text-slate-100 min-h-screen space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span>🔑</span> Environment Connections & Credentials
        </h1>
        <p className="text-xs text-slate-400 mt-1">Reference-based credential security: API keys, OAuth 2.0, Bearer tokens & secret isolation.</p>
      </div>

      <div className="bg-[#111113] border border-white/10 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">Configured Connections ({connections.length})</h2>
        {connections.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">No active connections created.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {connections.map((c) => (
              <div key={c.id} className="py-4 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-emerald-400 font-bold">{c.connectionCode}</span>
                    <span className="font-semibold text-white">{c.name}</span>
                  </div>
                  <span className="text-slate-400 text-[11px] font-mono">
                    Credential Ref: {c.credentialReference?.slice(0, 16)}...****
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                    {c.authType}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                    {c.environment}
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

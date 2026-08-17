'use client';

import React from 'react';

interface Props {
  webhooks: any[];
}

export default function WebhookListClient({ webhooks }: Props) {
  return (
    <div className="p-6 bg-[#09090B] text-slate-100 min-h-screen space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span>⚡</span> Webhook Gateway & Signature Verification
        </h1>
        <p className="text-xs text-slate-400 mt-1">Inbound/outbound webhook endpoints, HMAC SHA-256 signatures & payload hashing.</p>
      </div>

      <div className="bg-[#111113] border border-white/10 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">Registered Webhooks ({webhooks.length})</h2>
        {webhooks.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">No webhook endpoints configured.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {webhooks.map((w) => (
              <div key={w.id} className="py-4 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono text-purple-400 font-bold mr-2">{w.webhookCode}</span>
                  <span className="font-semibold text-white mr-2">{w.name}</span>
                  <span className="text-slate-400 font-mono">({w.endpointPath})</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">{w.signatureAlgorithm}</span>
                  <span className="text-emerald-400">{w.eventType}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React from 'react';

export function AdminAutomationClient() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Administrative Automation Settings</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Global automation engine settings, provider adapters, and execution limits
          </p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-white/10 rounded-lg p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white">Engine Configuration</h3>
        <div className="text-xs text-zinc-400 space-y-2">
          <div>Max Retry Limit: <span className="font-mono text-white">3</span></div>
          <div>Idempotency Protection: <span className="font-mono text-emerald-400">ENABLED (Row Locking + Unique Constraints)</span></div>
          <div>Financial Ledger Isolation: <span className="font-mono text-emerald-400">ENFORCED (Prompt 05 Sole Authority)</span></div>
        </div>
      </div>
    </div>
  );
}

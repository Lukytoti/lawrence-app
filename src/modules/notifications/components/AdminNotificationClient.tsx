'use client';

import React from 'react';

export function AdminNotificationClient() {
  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-5">
        <h1 className="text-2xl font-bold text-white tracking-tight">Notification System Administration</h1>
        <p className="text-sm text-zinc-400 mt-1">Configure multi-channel provider credentials, retry policies, and suppression lists</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-zinc-900/60 border border-white/10 space-y-3">
          <h3 className="text-base font-semibold text-white">Active Provider Adapters</h3>
          <div className="space-y-2 text-xs text-zinc-300">
            <div className="flex items-center justify-between p-2.5 rounded bg-zinc-950 border border-white/5">
              <span>SMTP / SendGrid Adapter</span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">ACTIVE</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded bg-zinc-950 border border-white/5">
              <span>Twilio SMS Adapter</span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">ACTIVE</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded bg-zinc-950 border border-white/5">
              <span>WhatsApp Cloud API</span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">ACTIVE</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded bg-zinc-950 border border-white/5">
              <span>Webhook HTTP Digest</span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">ACTIVE</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-zinc-900/60 border border-white/10 space-y-3">
          <h3 className="text-base font-semibold text-white">System Integrity & Privacy Policy</h3>
          <div className="space-y-2 text-xs text-zinc-400">
            <p>• <strong>Double-Entry Ledger Boundary:</strong> Notification Engine cannot mutate FinancialAccount balances.</p>
            <p>• <strong>Credential Sanitization:</strong> Passwords, API secrets, and tokens auto-redacted in delivery logs.</p>
            <p>• <strong>Idempotency Enforcement:</strong> Database unique constraint on idempotencyKey prevents duplicate dispatches.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

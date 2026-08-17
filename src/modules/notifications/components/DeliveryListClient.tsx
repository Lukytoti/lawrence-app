'use client';

import React from 'react';

interface DeliveryListClientProps {
  initialDeliveries: any[];
}

export function DeliveryListClient({ initialDeliveries }: DeliveryListClientProps) {
  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-5">
        <h1 className="text-2xl font-bold text-white tracking-tight">Delivery Monitoring & Tracking</h1>
        <p className="text-sm text-zinc-400 mt-1">Real-time provider delivery status, attempt counts, and error tracebacks</p>
      </div>

      <div className="rounded-xl bg-zinc-900/60 border border-white/10 overflow-hidden">
        <table className="w-full text-left text-sm text-zinc-300">
          <thead className="bg-zinc-950 text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-white/10">
            <tr>
              <th className="px-4 py-3">Message Code</th>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Provider Msg ID</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Attempts</th>
              <th className="px-4 py-3">Delivered At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono text-xs">
            {initialDeliveries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500 font-sans">
                  No delivery records found.
                </td>
              </tr>
            ) : (
              initialDeliveries.map((del) => (
                <tr key={del.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-white font-semibold">{del.message?.messageCode}</td>
                  <td className="px-4 py-3">{del.provider}</td>
                  <td className="px-4 py-3 text-zinc-400">{del.providerMessageId || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        del.status === 'SUCCESS'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {del.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{del.attemptCount}</td>
                  <td className="px-4 py-3 text-zinc-400 font-sans">
                    {del.deliveredAt ? new Date(del.deliveredAt).toLocaleString() : 'N/A'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

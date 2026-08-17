'use client';

import React from 'react';
import Link from 'next/link';

interface Props {
  logs: any[];
}

export default function ResilienceAuditClient({ logs }: Props) {
  return (
    <div className="p-6 bg-[#09090B] text-slate-100 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>📜</span> Resilience & Recovery Audit Trail
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Immutable audit record of all backup creations, verifications, disaster recovery executions, and drills.
          </p>
        </div>
        <Link
          href="/resilience"
          className="px-4 py-2 text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition border border-white/10"
        >
          ← Back to Overview
        </Link>
      </div>

      {/* Audit Log Table */}
      <div className="p-5 bg-[#111113] border border-white/10 rounded-xl space-y-4">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Audit Trail Records</h2>
        {logs.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No resilience audit logs found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-white/10 uppercase bg-white/5">
                <tr>
                  <th className="p-3">Event Code</th>
                  <th className="p-3">Event Type</th>
                  <th className="p-3">Message</th>
                  <th className="p-3">Correlation ID</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map(l => (
                  <tr key={l.id} className="hover:bg-white/5 transition">
                    <td className="p-3 font-mono text-slate-300">{l.eventCode}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-white/10 text-slate-200">
                        {l.eventType}
                      </span>
                    </td>
                    <td className="p-3 text-slate-200">{l.message}</td>
                    <td className="p-3 font-mono text-slate-400 text-[10px]">{l.correlationId || '-'}</td>
                    <td className="p-3 text-slate-400">{new Date(l.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

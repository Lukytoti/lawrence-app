'use client';

import React from 'react';
import Link from 'next/link';

interface Props {
  incidents: any[];
}

export default function ResilienceIncidentClient({ incidents }: Props) {
  return (
    <div className="p-6 bg-[#09090B] text-slate-100 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>🚨</span> Resilience Incidents & Recovery Tracking
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Tracking resilience incidents across backup failures, RPO/RTO violations, and recovery lifecycle.
          </p>
        </div>
        <Link
          href="/resilience"
          className="px-4 py-2 text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition border border-white/10"
        >
          ← Back to Overview
        </Link>
      </div>

      {/* Incidents Table */}
      <div className="p-5 bg-[#111113] border border-white/10 rounded-xl space-y-4">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Incident Register</h2>
        {incidents.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No resilience incidents recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-white/10 uppercase bg-white/5">
                <tr>
                  <th className="p-3">Incident Code</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Detected At</th>
                  <th className="p-3">Resolved At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {incidents.map(inc => (
                  <tr key={inc.id} className="hover:bg-white/5 transition">
                    <td className="p-3 font-mono text-slate-200 font-bold">{inc.incidentCode}</td>
                    <td className="p-3 text-white font-medium">{inc.name}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                        inc.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300'
                          : inc.severity === 'HIGH'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-500/20 text-slate-300'
                      }`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                        inc.status === 'RESOLVED' || inc.status === 'CLOSED'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {inc.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">{inc.source}</td>
                    <td className="p-3 text-slate-400">{new Date(inc.detectedAt).toLocaleString()}</td>
                    <td className="p-3 text-slate-400">{inc.resolvedAt ? new Date(inc.resolvedAt).toLocaleString() : 'Open'}</td>
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

'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface Props {
  dependencies: any[];
}

export default function DependencyMapClient({ dependencies }: Props) {
  const [filterType, setFilterType] = useState<string>('ALL');

  const filtered = filterType === 'ALL'
    ? dependencies
    : dependencies.filter(d => d.dependencyType === filterType);

  return (
    <div className="p-6 bg-[#09090B] text-slate-100 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>🗺️</span> Platform Service Dependency Topology
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Service criticalities, fallback strategies, circular dependency tracking, and target RTO/RPOs.
          </p>
        </div>
        <Link
          href="/resilience"
          className="px-4 py-2 text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition border border-white/10"
        >
          ← Back to Overview
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {['ALL', 'DATABASE', 'CACHE', 'STORAGE', 'EXTERNAL_API', 'INTEGRATION', 'MESSAGING', 'AUTHENTICATION'].map(t => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              filterType === t ? 'bg-[#5B1111] text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Dependency Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(d => (
          <div key={d.id} className="p-4 bg-[#111113] border border-white/10 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-200">{d.dependencyCode}</span>
              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                d.criticality === 'CRITICAL'
                  ? 'bg-rose-500/20 text-rose-300'
                  : d.criticality === 'HIGH'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {d.criticality}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">{d.name}</h3>
              <p className="text-xs text-slate-400">Service: <span className="text-slate-200">{d.serviceName}</span></p>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1 border-t border-white/5 pt-2">
              <div>Type: <span className="text-sky-400 font-semibold">{d.dependencyType}</span></div>
              <div>Fallback: <span className="text-slate-300">{d.fallbackStrategy || 'Standard Retry'}</span></div>
              <div>Target RPO / RTO: <span className="text-slate-200">{d.rpoMinutes || '-'}m / {d.rtoMinutes || '-'}m</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

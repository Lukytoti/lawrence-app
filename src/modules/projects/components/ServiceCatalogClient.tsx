'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface ServiceCatalogClientProps {
  services: any[];
}

export function ServiceCatalogClient({ services }: ServiceCatalogClientProps) {
  const [serviceList] = useState(services || []);

  return (
    <div className="min-h-screen bg-[#09090B] text-slate-100 p-6 space-y-6">
      <Link href="/projects" className="text-xs text-slate-400 hover:text-slate-200 transition-colors">
        ← Back to Projects Command Center
      </Link>

      <div className="flex items-center justify-between border-b border-white/10 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Digital Service Catalog</h1>
          <p className="text-sm text-slate-400">
            Configure digital marketing, funnel, GoHighLevel, n8n, AI agents, and consulting services
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {serviceList.map((svc) => (
          <div key={svc.id} className="bg-[#111113] border border-white/10 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                {svc.code}
              </span>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded ${svc.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                {svc.isActive ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">{svc.name}</h3>
            <p className="text-xs text-slate-400">{svc.description || 'No description provided.'}</p>
            <div className="text-xs text-slate-500 pt-2 border-t border-white/5 flex items-center justify-between">
              <span>Category: {svc.category}</span>
              <span>Default Duration: {svc.defaultDurationDays} days</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

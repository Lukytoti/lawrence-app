'use client';

import React from 'react';

interface Props {
  mappings: any[];
}

export default function MappingListClient({ mappings }: Props) {
  return (
    <div className="p-6 bg-[#09090B] text-slate-100 min-h-screen space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span>🔄</span> Data & Field Transformation Mappings
        </h1>
        <p className="text-xs text-slate-400 mt-1">Field renaming, type conversions, default values & nested JSON entity mappings.</p>
      </div>

      <div className="bg-[#111113] border border-white/10 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">Configured Mappings ({mappings.length})</h2>
        {mappings.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">No field mappings configured.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {mappings.map((m) => (
              <div key={m.id} className="py-4 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono text-amber-400 font-bold mr-2">{m.mappingCode}</span>
                  <span className="font-semibold text-white">
                    {m.sourceSystem}:{m.sourceEntity} → {m.targetSystem}:{m.targetEntity}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
                  Active
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

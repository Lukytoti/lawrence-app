'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface ProjectTemplatesClientProps {
  templates: any[];
}

export function ProjectTemplatesClient({ templates }: ProjectTemplatesClientProps) {
  const [templateList] = useState(templates || []);

  return (
    <div className="min-h-screen bg-[#09090B] text-slate-100 p-6 space-y-6">
      <Link href="/projects" className="text-xs text-slate-400 hover:text-slate-200 transition-colors">
        ← Back to Projects Command Center
      </Link>

      <div className="flex items-center justify-between border-b border-white/10 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Project Templates</h1>
          <p className="text-sm text-slate-400">
            Configure standardized milestone sequences and task templates for automated project creation
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templateList.map((tpl) => (
          <div key={tpl.id} className="bg-[#111113] border border-white/10 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                {tpl.code}
              </span>
              <span className="text-xs font-medium text-slate-400">
                Est. {tpl.estimatedDurationDays} Days
              </span>
            </div>
            <h3 className="text-xl font-bold text-white">{tpl.name}</h3>
            <p className="text-xs text-slate-400">{tpl.description}</p>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Template Milestones</h4>
              {tpl.milestones?.map((m: any) => (
                <div key={m.id} className="p-2.5 bg-[#18181B] border border-white/5 rounded text-xs flex items-center justify-between">
                  <div>
                    <span className="font-mono text-slate-500 mr-2">#{m.sequence}</span>
                    <span className="font-semibold text-slate-200">{m.name}</span>
                  </div>
                  <span className="text-slate-400 font-mono">+ Day {m.dayOffset}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

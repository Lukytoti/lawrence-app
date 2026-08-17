'use client';

import React from 'react';

interface ClientPortalClientProps {
  projectData: any;
}

export function ClientPortalClient({ projectData }: ClientPortalClientProps) {
  if (!projectData) {
    return (
      <div className="p-8 text-center text-slate-400">
        Unauthorized access or project unavailable.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-slate-100 p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-white/10 pb-5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
          <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">
            Client Portal Access
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white mt-1">{projectData.title}</h1>
        <p className="text-sm text-slate-400">
          Client: {projectData.client?.companyName}
        </p>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111113] border border-white/10 rounded-xl p-4">
          <span className="text-xs text-slate-400 uppercase">Project Status</span>
          <div className="text-xl font-bold text-white mt-1">{projectData.status}</div>
        </div>

        <div className="bg-[#111113] border border-white/10 rounded-xl p-4">
          <span className="text-xs text-slate-400 uppercase">Service Category</span>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            {projectData.service?.name || 'Digital Delivery'}
          </div>
        </div>

        <div className="bg-[#111113] border border-white/10 rounded-xl p-4">
          <span className="text-xs text-slate-400 uppercase">Target Completion</span>
          <div className="text-xl font-bold text-slate-200 mt-1">
            {projectData.targetEndDate ? new Date(projectData.targetEndDate).toLocaleDateString() : 'TBD'}
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-[#111113] border border-white/10 rounded-xl p-5 space-y-4">
        <h3 className="text-lg font-semibold text-white">Project Milestones</h3>
        <div className="space-y-3">
          {projectData.milestones?.map((m: any) => (
            <div key={m.id} className="p-4 bg-[#18181B] border border-white/5 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-slate-400">Step {m.sequence}</span>
                <h4 className="text-sm font-semibold text-white">{m.name}</h4>
                <p className="text-xs text-slate-400">{m.description}</p>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-300">
                {m.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Deliverables for Review */}
      <div className="bg-[#111113] border border-white/10 rounded-xl p-5 space-y-4">
        <h3 className="text-lg font-semibold text-white">Deliverables & Reviews</h3>
        <div className="space-y-3">
          {projectData.deliverables?.map((d: any) => (
            <div key={d.id} className="p-4 bg-[#18181B] border border-white/5 rounded-lg flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white">{d.name} (v{d.version})</h4>
                <p className="text-xs text-slate-400">Status: {d.status}</p>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-300">
                {d.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Client Visible Activity Timeline */}
      <div className="bg-[#111113] border border-white/10 rounded-xl p-5 space-y-4">
        <h3 className="text-lg font-semibold text-white">Public Updates</h3>
        <div className="space-y-3">
          {projectData.activities?.map((act: any) => (
            <div key={act.id} className="p-3 bg-[#18181B] border border-white/5 rounded text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-semibold text-slate-200">{act.activityType}</span>
                <span>{new Date(act.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-slate-300">{act.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

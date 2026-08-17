'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface ProjectDetailClientProps {
  project: any;
  userId: string;
}

export function ProjectDetailClient({ project, userId }: ProjectDetailClientProps) {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MILESTONES' | 'TASKS' | 'DELIVERABLES' | 'TIMELINE'>('OVERVIEW');

  if (!project) {
    return (
      <div className="p-8 text-center text-slate-400">
        Project not found or access restricted.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-slate-100 p-6 space-y-6">
      {/* Back Link */}
      <Link href="/projects" className="text-xs text-slate-400 hover:text-slate-200 transition-colors">
        ← Back to Projects Command Center
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {project.projectCode}
            </span>
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              {project.service?.name || 'Digital Delivery'}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mt-1">{project.title}</h1>
          <p className="text-sm text-slate-400">
            Client: {project.client?.companyName} ({project.client?.contactName})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/client/projects/${project.id}`}
            target="_blank"
            className="px-4 py-2 text-xs font-medium bg-emerald-700 hover:bg-emerald-600 text-white rounded-md transition-colors"
          >
            Preview Client Portal
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#111113] border border-white/10 rounded-xl p-4 space-y-1">
          <span className="text-xs text-slate-400 uppercase tracking-wider">Status</span>
          <div className="text-lg font-bold text-white">{project.status}</div>
        </div>

        <div className="bg-[#111113] border border-white/10 rounded-xl p-4 space-y-1">
          <span className="text-xs text-slate-400 uppercase tracking-wider">Health Signal</span>
          <div className="text-lg font-bold text-emerald-400">{project.health?.health || 'ON_TRACK'}</div>
        </div>

        <div className="bg-[#111113] border border-white/10 rounded-xl p-4 space-y-1">
          <span className="text-xs text-slate-400 uppercase tracking-wider">Overall Progress</span>
          <div className="text-lg font-bold text-white">{project.progress?.overallProgressPercent || 0}%</div>
        </div>

        <div className="bg-[#111113] border border-white/10 rounded-xl p-4 space-y-1">
          <span className="text-xs text-slate-400 uppercase tracking-wider">Contract Value</span>
          <div className="text-lg font-bold font-mono text-wine-300">
            {project.currency} {Number(project.contractValue).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 gap-4 text-sm font-medium">
        {(['OVERVIEW', 'MILESTONES', 'TASKS', 'DELIVERABLES', 'TIMELINE'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-[#991B1B] text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#111113] border border-white/10 rounded-xl p-5 space-y-4">
            <h3 className="text-lg font-semibold text-white">Project Details</h3>
            <p className="text-sm text-slate-300">{project.description || 'No description provided.'}</p>
            <div className="space-y-2 text-xs text-slate-400">
              <div>Project Owner: <span className="text-slate-200">{project.owner?.name || 'N/A'}</span></div>
              <div>Project Manager: <span className="text-slate-200">{project.projectManager?.name || 'N/A'}</span></div>
              <div>Start Date: <span className="text-slate-200">{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</span></div>
              <div>Target End Date: <span className="text-slate-200">{project.targetEndDate ? new Date(project.targetEndDate).toLocaleDateString() : 'N/A'}</span></div>
            </div>
          </div>

          <div className="bg-[#111113] border border-white/10 rounded-xl p-5 space-y-4">
            <h3 className="text-lg font-semibold text-white">Health & Risk Factors</h3>
            {project.health?.riskFactors?.length === 0 ? (
              <p className="text-sm text-emerald-400">No active risk factors. Delivery is on track.</p>
            ) : (
              <ul className="list-disc list-inside text-sm text-amber-300 space-y-1">
                {project.health?.riskFactors?.map((rf: string, i: number) => (
                  <li key={i}>{rf}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {activeTab === 'MILESTONES' && (
        <div className="bg-[#111113] border border-white/10 rounded-xl p-5 space-y-4">
          <h3 className="text-lg font-semibold text-white">Project Milestones</h3>
          <div className="space-y-3">
            {project.milestones?.map((m: any) => (
              <div key={m.id} className="p-4 bg-[#18181B] border border-white/5 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-slate-400">Seq {m.sequence}</span>
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
      )}

      {activeTab === 'TASKS' && (
        <div className="bg-[#111113] border border-white/10 rounded-xl p-5 space-y-4">
          <h3 className="text-lg font-semibold text-white">Project Tasks</h3>
          <div className="space-y-3">
            {project.tasks?.map((t: any) => (
              <div key={t.id} className="p-4 bg-[#18181B] border border-white/5 rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">{t.title}</h4>
                  <p className="text-xs text-slate-400">Assigned To: {t.assignedTo?.name || 'Unassigned'}</p>
                </div>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-800 text-slate-300">
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'DELIVERABLES' && (
        <div className="bg-[#111113] border border-white/10 rounded-xl p-5 space-y-4">
          <h3 className="text-lg font-semibold text-white">Deliverables & Client Reviews</h3>
          <div className="space-y-3">
            {project.deliverables?.map((d: any) => (
              <div key={d.id} className="p-4 bg-[#18181B] border border-white/5 rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">{d.name} (v{d.version})</h4>
                  <p className="text-xs text-slate-400">Type: {d.type}</p>
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-300">
                  {d.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'TIMELINE' && (
        <div className="bg-[#111113] border border-white/10 rounded-xl p-5 space-y-4">
          <h3 className="text-lg font-semibold text-white">Activity Timeline</h3>
          <div className="space-y-3">
            {project.activities?.map((act: any) => (
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
      )}
    </div>
  );
}

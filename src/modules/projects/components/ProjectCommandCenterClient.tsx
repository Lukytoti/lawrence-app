'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface ProjectCommandCenterClientProps {
  initialProjects: any[];
  userId: string;
}

export function ProjectCommandCenterClient({ initialProjects, userId }: ProjectCommandCenterClientProps) {
  const [projects] = useState(initialProjects || []);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredProjects = projects.filter((p) => {
    if (statusFilter === 'ALL') return true;
    return p.status === statusFilter;
  });

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === 'ACTIVE' || p.status === 'PLANNED').length;
  const atRiskProjects = projects.filter((p) => p.health?.health === 'AT_RISK' || p.health?.health === 'OVERDUE').length;
  const completedProjects = projects.filter((p) => p.status === 'COMPLETED').length;

  return (
    <div className="min-h-screen bg-[#09090B] text-slate-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">
              Service Delivery Operating System
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mt-1">
            Digital Project Command Center
          </h1>
          <p className="text-sm text-slate-400">
            Client projects, deliverable reviews, milestones, and service delivery status
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/projects/services"
            className="px-4 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors border border-white/10"
          >
            Services Catalog
          </Link>
          <Link
            href="/admin/projects/templates"
            className="px-4 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors border border-white/10"
          >
            Project Templates
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111113] border border-white/10 rounded-xl p-4 space-y-1">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Projects</span>
          <div className="text-2xl font-bold text-white">{totalProjects}</div>
          <span className="text-xs text-slate-500">Across all commercial domains</span>
        </div>

        <div className="bg-[#111113] border border-emerald-500/20 rounded-xl p-4 space-y-1">
          <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Active Projects</span>
          <div className="text-2xl font-bold text-emerald-400">{activeProjects}</div>
          <span className="text-xs text-slate-500">Currently in delivery pipeline</span>
        </div>

        <div className="bg-[#111113] border border-amber-500/20 rounded-xl p-4 space-y-1">
          <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">At-Risk / Overdue</span>
          <div className="text-2xl font-bold text-amber-400">{atRiskProjects}</div>
          <span className="text-xs text-slate-500">Requires management attention</span>
        </div>

        <div className="bg-[#111113] border border-blue-500/20 rounded-xl p-4 space-y-1">
          <span className="text-xs font-medium text-blue-400 uppercase tracking-wider">Completed</span>
          <div className="text-2xl font-bold text-blue-400">{completedProjects}</div>
          <span className="text-xs text-slate-500">Successfully delivered</span>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        {['ALL', 'PLANNED', 'ACTIVE', 'CLIENT_REVIEW', 'REVISION_REQUIRED', 'COMPLETED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              statusFilter === st
                ? 'bg-wine-900/80 text-wine-100 bg-[#7F1D1D] text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Project Table */}
      <div className="bg-[#111113] border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#18181B] text-xs uppercase tracking-wider text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-4 py-3">Code / Project Title</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Health</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3">Contract Value</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No projects found for selected status filter.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-slate-400">{p.projectCode}</div>
                      <div className="font-medium text-white">{p.title}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-200">
                      {p.client?.companyName || p.client?.contactName || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {p.service?.name || 'Custom Digital Delivery'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-300">
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                          p.health?.health === 'ON_TRACK'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : p.health?.health === 'AT_RISK'
                            ? 'bg-amber-500/20 text-amber-300'
                            : p.health?.health === 'OVERDUE'
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {p.health?.health || 'ON_TRACK'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-[#991B1B] h-1.5 rounded-full"
                            style={{ width: `${p.progress?.overallProgressPercent || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-mono text-slate-400">
                          {p.progress?.overallProgressPercent || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-200">
                      {p.currency} {Number(p.contractValue).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/projects/${p.id}`}
                        className="px-3 py-1 text-xs font-medium bg-[#7F1D1D] hover:bg-[#991B1B] text-white rounded transition-colors"
                      >
                        View Project
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

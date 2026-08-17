'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { updateWorkflowStatusAction } from '../actions';

interface Props {
  workflows: any[];
  currentUserId: string;
}

export function WorkflowListClient({ workflows: initialWorkflows, currentUserId }: Props) {
  const [workflows, setWorkflows] = useState(initialWorkflows);

  const handleToggleStatus = async (workflowId: string, currentActive: boolean) => {
    try {
      const newStatus = currentActive ? 'PAUSED' : 'ACTIVE';
      await updateWorkflowStatusAction(currentUserId, workflowId, newStatus);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Failed to update workflow status.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Workflow Library</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Configured cross-domain automations, triggers, and condition rules
          </p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-zinc-950 text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Workflow</th>
                <th className="py-3.5 px-4">Domain</th>
                <th className="py-3.5 px-4">Trigger Type</th>
                <th className="py-3.5 px-4">Steps Count</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
              {workflows.map((wf) => (
                <tr key={wf.id} className="hover:bg-white/[0.02] transition">
                  <td className="py-4 px-4">
                    <div className="font-semibold text-white">{wf.name}</div>
                    <div className="text-xs text-zinc-500 font-mono">{wf.workflowCode} (v{wf.version})</div>
                  </td>
                  <td className="py-4 px-4 text-xs font-semibold text-zinc-300">
                    {wf.domain}
                  </td>
                  <td className="py-4 px-4 text-xs font-mono text-amber-400">
                    {wf.triggerType}
                  </td>
                  <td className="py-4 px-4 font-mono text-xs text-zinc-400">
                    {wf.steps?.length || 0} Step(s)
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                        wf.isActive
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {wf.isActive ? 'ACTIVE' : 'DRAFT / PAUSED'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleToggleStatus(wf.id, wf.isActive)}
                      className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs font-medium transition"
                    >
                      {wf.isActive ? 'Pause' : 'Activate'}
                    </button>
                    <Link
                      href={`/automation/workflows/${wf.id}`}
                      className="px-2.5 py-1 bg-burgundy-900 hover:bg-burgundy-800 text-white rounded text-xs font-medium transition"
                    >
                      Builder &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

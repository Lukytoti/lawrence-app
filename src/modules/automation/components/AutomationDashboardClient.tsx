'use client';

import React from 'react';
import Link from 'next/link';

interface Props {
  metrics: {
    activeWorkflowsCount: number;
    totalWorkflowsCount: number;
    executionsTodayCount: number;
    successfulTodayCount: number;
    failedTodayCount: number;
    successRate: number;
    recentLogs: any[];
  };
}

export function AutomationDashboardClient({ metrics }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Workflow Automation & Orchestration
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Executive cross-domain workflow command center and automation execution logs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/automation/workflows"
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md text-sm font-medium transition"
          >
            Workflow Library
          </Link>
          <Link
            href="/automation/executions"
            className="px-4 py-2 bg-burgundy-900 hover:bg-burgundy-800 text-white rounded-md text-sm font-medium transition"
          >
            Executions Monitor
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-white/10 p-5 rounded-lg">
          <div className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
            Active Workflows
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">
            {metrics.activeWorkflowsCount} / {metrics.totalWorkflowsCount}
          </div>
          <div className="text-xs text-zinc-500 mt-1">Operational cross-domain workflows</div>
        </div>

        <div className="bg-zinc-900 border border-white/10 p-5 rounded-lg">
          <div className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
            Executions Today
          </div>
          <div className="text-3xl font-extrabold text-white mt-2 font-mono">
            {metrics.executionsTodayCount}
          </div>
          <div className="text-xs text-emerald-400 mt-1">
            {metrics.successfulTodayCount} Succeeded | {metrics.failedTodayCount} Failed
          </div>
        </div>

        <div className="bg-zinc-900 border border-emerald-500/20 p-5 rounded-lg">
          <div className="text-xs text-emerald-400 uppercase tracking-wider font-semibold">
            Automation Success Rate
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2 font-mono">
            {metrics.successRate}%
          </div>
          <div className="text-xs text-zinc-400 mt-1">Across all historical executions</div>
        </div>

        <div className="bg-zinc-900 border border-white/10 p-5 rounded-lg">
          <div className="text-xs text-amber-400 uppercase tracking-wider font-semibold">
            Pending Approvals
          </div>
          <div className="text-3xl font-extrabold text-amber-400 mt-2 font-mono">0</div>
          <div className="text-xs text-zinc-400 mt-1">High-risk actions requiring sign-off</div>
        </div>
      </div>

      {/* Execution Logs Audit Trail */}
      <div className="bg-zinc-900 border border-white/10 rounded-lg p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white">Recent Automation Execution Trail</h3>
        <div className="space-y-2">
          {metrics.recentLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 bg-zinc-950 rounded border border-white/5 flex flex-col sm:flex-row justify-between sm:items-center text-xs gap-2"
            >
              <div>
                <span className="font-semibold text-white mr-2">
                  [{log.execution?.workflow?.workflowCode || 'SYSTEM'}]
                </span>
                <span className="text-zinc-300">{log.message}</span>
              </div>
              <div className="text-zinc-500 font-mono text-xs">
                {new Date(log.createdAt).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

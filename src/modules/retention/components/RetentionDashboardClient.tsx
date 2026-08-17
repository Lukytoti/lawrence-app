'use client';

import React from 'react';
import Link from 'next/link';

interface Props {
  metrics: {
    totalClients: number;
    healthyCount: number;
    stableCount: number;
    atRiskCount: number;
    criticalCount: number;
    churnedCount: number;
    openCasesCount: number;
    renewalsDueCount: number;
    renewalRate: number;
    churnRate: number;
    revenueAtRisk: number;
    expansionPipelineValue: number;
  };
}

export function RetentionDashboardClient({ metrics }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Client Retention & Revenue Operations
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Executive client health monitoring, renewal forecasting, and churn prevention cockpit
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/retention/clients"
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md text-sm font-medium transition"
          >
            Client Health Table
          </Link>
          <Link
            href="/retention/renewals"
            className="px-4 py-2 bg-burgundy-900 hover:bg-burgundy-800 text-white rounded-md text-sm font-medium transition"
          >
            Renewal Workspace
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-white/10 p-5 rounded-lg">
          <div className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
            Active Clients
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">
            {metrics.totalClients}
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            {metrics.healthyCount} Healthy / {metrics.stableCount} Stable
          </div>
        </div>

        <div className="bg-zinc-900 border border-amber-500/20 p-5 rounded-lg">
          <div className="text-xs text-amber-400 uppercase tracking-wider font-semibold">
            At-Risk / Critical
          </div>
          <div className="text-3xl font-extrabold text-amber-400 mt-2">
            {metrics.atRiskCount + metrics.criticalCount}
          </div>
          <div className="text-xs text-zinc-400 mt-1">
            {metrics.atRiskCount} At Risk | {metrics.criticalCount} Critical
          </div>
        </div>

        <div className="bg-zinc-900 border border-white/10 p-5 rounded-lg">
          <div className="text-xs text-emerald-400 uppercase tracking-wider font-semibold">
            Renewal Rate
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">
            {metrics.renewalRate}%
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            {metrics.renewalsDueCount} upcoming renewals due
          </div>
        </div>

        <div className="bg-zinc-900 border border-rose-500/20 p-5 rounded-lg">
          <div className="text-xs text-rose-400 uppercase tracking-wider font-semibold">
            Revenue At Risk
          </div>
          <div className="text-3xl font-extrabold text-rose-400 mt-2">
            NGN {metrics.revenueAtRisk.toLocaleString()}
          </div>
          <div className="text-xs text-zinc-400 mt-1">
            Across {metrics.renewalsDueCount} expiring contracts
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-white/10 p-5 rounded-lg">
          <h3 className="text-sm font-semibold text-white mb-2">Open Retention Cases</h3>
          <div className="text-2xl font-bold text-amber-400">{metrics.openCasesCount}</div>
          <p className="text-xs text-zinc-400 mt-1">Active investigations requiring action</p>
          <Link
            href="/retention/cases"
            className="inline-block text-xs text-burgundy-400 hover:text-burgundy-300 font-medium mt-3"
          >
            Manage Cases &rarr;
          </Link>
        </div>

        <div className="bg-zinc-900 border border-white/10 p-5 rounded-lg">
          <h3 className="text-sm font-semibold text-white mb-2">Expansion Pipeline</h3>
          <div className="text-2xl font-bold text-emerald-400">
            NGN {metrics.expansionPipelineValue.toLocaleString()}
          </div>
          <p className="text-xs text-zinc-400 mt-1">Identified cross-sell & upsell opportunities</p>
          <Link
            href="/retention/clients"
            className="inline-block text-xs text-burgundy-400 hover:text-burgundy-300 font-medium mt-3"
          >
            View Expansion Leads &rarr;
          </Link>
        </div>

        <div className="bg-zinc-900 border border-white/10 p-5 rounded-lg">
          <h3 className="text-sm font-semibold text-white mb-2">Annualized Churn Rate</h3>
          <div className="text-2xl font-bold text-zinc-200">{metrics.churnRate}%</div>
          <p className="text-xs text-zinc-400 mt-1">{metrics.churnedCount} historical churned clients</p>
        </div>
      </div>
    </div>
  );
}

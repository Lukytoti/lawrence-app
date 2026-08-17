'use client';

import React, { useState } from 'react';
import { ExecutiveDashboardDataDTO } from '../types';
import {
  Users,
  TrendingUp,
  Award,
  DollarSign,
  Briefcase,
  Activity,
  MessageSquare,
  AlertTriangle,
  Download,
  Filter,
  RefreshCw,
  Search,
} from 'lucide-react';

interface Props {
  initialData: ExecutiveDashboardDataDTO;
  userId: string;
}

export function ExecutiveDashboardClient({ initialData, userId }: Props) {
  const [data, setData] = useState<ExecutiveDashboardDataDTO>(initialData);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ORGANIZATION' | 'QUALIFICATION' | 'COMPENSATION' | 'CRM' | 'PRODUCTIVITY' | 'COMMUNITY'>('OVERVIEW');
  const [exporting, setExporting] = useState(false);

  const handleExport = async (reportType: string) => {
    setExporting(true);
    try {
      const { exportAnalyticsCsvAction } = await import('../actions');
      const csv = await exportAnalyticsCsvAction(userId, reportType);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Executive_Report_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6 bg-[#09090B] text-slate-100 min-h-screen space-y-8 font-sans">
      {/* Executive Command Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">Executive Intelligence Command Center</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#7F1D1D]/30 border border-[#7F1D1D] text-red-300">
              Prompt 09 Core
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Authoritative multi-domain analytics, performance trends, and decision intelligence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleExport(activeTab === 'OVERVIEW' ? 'ORGANIZATION' : activeTab)}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#18181B] hover:bg-[#27272A] text-slate-200 border border-white/10 transition-colors"
          >
            <Download className="w-4 h-4 text-red-400" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Domain Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {[
          { key: 'OVERVIEW', label: 'Executive Overview', icon: TrendingUp },
          { key: 'ORGANIZATION', label: 'Organization', icon: Users },
          { key: 'QUALIFICATION', label: 'Ranks & Quals', icon: Award },
          { key: 'COMPENSATION', label: 'Compensation & Ledger', icon: DollarSign },
          { key: 'CRM', label: 'CRM Sales Funnel', icon: Briefcase },
          { key: 'PRODUCTIVITY', label: 'Productivity', icon: Activity },
          { key: 'COMMUNITY', label: 'Community & Leadership', icon: MessageSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#7F1D1D] text-white shadow-lg shadow-[#7F1D1D]/20'
                  : 'bg-[#18181B] text-slate-400 hover:text-slate-200 hover:bg-[#27272A]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Anomalies & Attention Panel */}
      {data.anomalies.length > 0 && (
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/40 space-y-3">
          <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Executive Attention & Anomaly Signals ({data.anomalies.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.anomalies.map((ano, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-[#18181B] border border-red-900/30 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-red-300">{ano.metricKey.toUpperCase()}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-900/50 text-red-200">
                    {ano.severity}
                  </span>
                </div>
                <p className="text-slate-300">{ano.explanation}</p>
                <div className="text-slate-500 text-[11px]">
                  Baseline: {ano.baselineValue} | Current: {ano.currentValue} ({ano.percentageChange}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.kpismatrix.map((kpi) => (
          <div key={kpi.key} className="p-5 rounded-xl bg-[#111113] border border-white/5 space-y-2 hover:border-white/10 transition-all">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{kpi.displayName}</span>
              <span className="text-[10px] text-slate-500 font-mono">{kpi.sourceModule}</span>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {kpi.unit === 'CURRENCY' ? `₦${kpi.currentValue.toLocaleString()}` : kpi.currentValue}
              {kpi.unit === 'PERCENT' ? '%' : ''}
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
              <span className="text-slate-500">Prev: {kpi.previousValue}</span>
              <span
                className={`font-semibold ${
                  kpi.trendDirection === 'UP'
                    ? 'text-emerald-400'
                    : kpi.trendDirection === 'DOWN'
                    ? 'text-red-400'
                    : 'text-slate-400'
                }`}
              >
                {kpi.trendDirection === 'UP' ? '+' : ''}
                {kpi.percentageChange}% {kpi.trendDirection === 'UP' ? '↑' : kpi.trendDirection === 'DOWN' ? '↓' : '→'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Domain Specific Detail Panels */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Organization & Ranks Overview */}
          <div className="p-6 rounded-xl bg-[#111113] border border-white/5 space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-red-400" />
              Organization & Qualification Performance
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-[#18181B]">
                <div className="text-slate-400 text-xs">Total Members</div>
                <div className="text-xl font-bold text-white">{data.organization.totalMembers}</div>
              </div>
              <div className="p-3 rounded-lg bg-[#18181B]">
                <div className="text-slate-400 text-xs">Active Members</div>
                <div className="text-xl font-bold text-emerald-400">{data.organization.activeMembers}</div>
              </div>
              <div className="p-3 rounded-lg bg-[#18181B]">
                <div className="text-slate-400 text-xs">Qualification Rate</div>
                <div className="text-xl font-bold text-amber-400">{data.qualification.qualificationRate}%</div>
              </div>
              <div className="p-3 rounded-lg bg-[#18181B]">
                <div className="text-slate-400 text-xs">Qualified Directors</div>
                <div className="text-xl font-bold text-purple-400">{data.rankPerformance.qualifiedDirectorCount}</div>
              </div>
            </div>
          </div>

          {/* CRM & Sales Funnel */}
          <div className="p-6 rounded-xl bg-[#111113] border border-white/5 space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-red-400" />
              CRM Sales Funnel & Pipeline
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-[#18181B]">
                <div className="text-slate-400 text-xs">Total Leads</div>
                <div className="text-xl font-bold text-white">{data.crm.totalLeads}</div>
              </div>
              <div className="p-3 rounded-lg bg-[#18181B]">
                <div className="text-slate-400 text-xs">Pipeline Value</div>
                <div className="text-xl font-bold text-emerald-400">₦{data.crm.totalPipelineValue.toLocaleString()}</div>
              </div>
              <div className="p-3 rounded-lg bg-[#18181B]">
                <div className="text-slate-400 text-xs">Opportunities Won</div>
                <div className="text-xl font-bold text-blue-400">{data.crm.opportunitiesWon}</div>
              </div>
              <div className="p-3 rounded-lg bg-[#18181B]">
                <div className="text-slate-400 text-xs">Conversion Rate</div>
                <div className="text-xl font-bold text-amber-400">{data.crm.conversionRate}%</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'COMPENSATION' && data.compensation && (
        <div className="p-6 rounded-xl bg-[#111113] border border-white/5 space-y-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-red-400" />
            Prompt 08 Compensation & Prompt 05 Double-Entry Ledger Summary
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#18181B] space-y-1">
              <div className="text-xs text-slate-400">Total Compensation Calculated</div>
              <div className="text-2xl font-bold text-white">₦{data.compensation.totalCalculatedAmount.toLocaleString()}</div>
            </div>
            <div className="p-4 rounded-xl bg-[#18181B] space-y-1">
              <div className="text-xs text-slate-400">Total Compensation Approved</div>
              <div className="text-2xl font-bold text-amber-400">₦{data.compensation.totalApprovedAmount.toLocaleString()}</div>
            </div>
            <div className="p-4 rounded-xl bg-[#18181B] space-y-1">
              <div className="text-xs text-slate-400">Total Compensation Posted to Ledger</div>
              <div className="text-2xl font-bold text-emerald-400">₦{data.compensation.totalPostedAmount.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

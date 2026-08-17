'use client';

import React from 'react';
import { ExecutiveKpiSummary } from '../types';
import { Users, CheckSquare, Target, FolderKanban, Receipt, ShieldAlert, Zap, Bell, Sparkles, DollarSign } from 'lucide-react';

interface ExecutiveKpiGridProps {
  summary: ExecutiveKpiSummary;
}

export const ExecutiveKpiGrid: React.FC<ExecutiveKpiGridProps> = ({ summary }) => {
  const cards = [
    {
      title: 'PEOPLE & NETWORK',
      value: summary.people.activeMembers,
      subtext: `Total: ${summary.people.totalMembers} • Orgs: ${summary.people.orgCount}`,
      icon: <Users className="w-5 h-5 text-wine-400" />,
      color: 'border-wine-800/40 bg-slate-900/60',
    },
    {
      title: 'PRODUCTIVITY',
      value: summary.productivity.workQueueCount,
      subtext: `Due Today: ${summary.productivity.tasksDueToday} • Overdue: ${summary.productivity.overdueTasks}`,
      icon: <CheckSquare className="w-5 h-5 text-emerald-400" />,
      color: 'border-emerald-800/40 bg-slate-900/60',
    },
    {
      title: 'CRM PIPELINE',
      value: `₦${summary.crm.pipelineValueTotal.toLocaleString()}`,
      subtext: `Open Opportunities: ${summary.crm.openOpportunitiesCount} • New Leads: ${summary.crm.newLeadsCount}`,
      icon: <Target className="w-5 h-5 text-blue-400" />,
      color: 'border-blue-800/40 bg-slate-900/60',
    },
    {
      title: 'PROJECT DELIVERY',
      value: summary.projects.activeProjectsCount,
      subtext: `At Risk: ${summary.projects.projectsAtRiskCount} • Overdue Milestones: ${summary.projects.overdueMilestonesCount}`,
      icon: <FolderKanban className="w-5 h-5 text-amber-400" />,
      color: 'border-amber-800/40 bg-slate-900/60',
    },
    {
      title: 'BILLING & REVENUE',
      value: `₦${summary.billing.totalUnpaidAmount.toLocaleString()}`,
      subtext: `Outstanding: ${summary.billing.outstandingInvoicesCount} • Overdue: ${summary.billing.overdueInvoicesCount}`,
      icon: <Receipt className="w-5 h-5 text-rose-400" />,
      color: 'border-rose-800/40 bg-slate-900/60',
    },
    {
      title: 'RETENTION HEALTH',
      value: summary.retention.healthyClientsCount,
      subtext: `At Risk: ${summary.retention.atRiskClientsCount} • Renewals: ${summary.retention.upcomingRenewalsCount}`,
      icon: <ShieldAlert className="w-5 h-5 text-purple-400" />,
      color: 'border-purple-800/40 bg-slate-900/60',
    },
    {
      title: 'WORKFLOW AUTOMATION',
      value: summary.automation.executionsTodayCount,
      subtext: `Workflows: ${summary.automation.activeWorkflowsCount} • Failed: ${summary.automation.failedExecutionsCount}`,
      icon: <Zap className="w-5 h-5 text-cyan-400" />,
      color: 'border-cyan-800/40 bg-slate-900/60',
    },
    {
      title: 'COMMUNICATIONS',
      value: summary.notifications.pendingMessagesCount,
      subtext: `Pending: ${summary.notifications.pendingMessagesCount} • Failed Delivery: ${summary.notifications.failedDeliveriesCount}`,
      icon: <Bell className="w-5 h-5 text-yellow-400" />,
      color: 'border-yellow-800/40 bg-slate-900/60',
    },
    {
      title: 'AI CO-PILOT QUOTA',
      value: `${summary.ai.promptsUsedToday}/100`,
      subtext: `Conversations: ${summary.ai.conversationsCount} • Daily Limit: 100`,
      icon: <Sparkles className="w-5 h-5 text-indigo-400" />,
      color: 'border-indigo-800/40 bg-slate-900/60',
    },
    {
      title: 'FINANCIAL LEDGER',
      value: 'CONNECTED',
      subtext: summary.finance.readOnlyStatus,
      icon: <DollarSign className="w-5 h-5 text-wine-500" />,
      color: 'border-wine-900/50 bg-slate-900/60',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, idx) => (
        <div key={idx} className={`p-4 rounded-xl border ${card.color} backdrop-blur-md shadow-lg transition-all hover:scale-[1.02]`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">{card.title}</span>
            {card.icon}
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{card.value}</div>
          <div className="text-xs text-slate-400 mt-1 truncate">{card.subtext}</div>
        </div>
      ))}
    </div>
  );
};

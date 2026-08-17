'use client';

import React from 'react';
import { ExecutiveDashboardDataDTO } from '../types';
import { Users, Award, Activity, MessageSquare } from 'lucide-react';

interface Props {
  data: ExecutiveDashboardDataDTO;
}

export function TeamAnalyticsClient({ data }: Props) {
  return (
    <div className="p-6 bg-[#09090B] text-slate-100 min-h-screen space-y-6">
      <div className="pb-4 border-b border-white/10">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Users className="w-6 h-6 text-red-500" />
          Team Performance Intelligence
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Scoped performance analytics for downline organization members.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#111113] border border-white/5 space-y-1">
          <div className="text-xs text-slate-400">Team Size</div>
          <div className="text-2xl font-bold text-white">{data.organization.totalMembers}</div>
        </div>
        <div className="p-4 rounded-xl bg-[#111113] border border-white/5 space-y-1">
          <div className="text-xs text-slate-400">Active Team Members</div>
          <div className="text-2xl font-bold text-emerald-400">{data.organization.activeMembers}</div>
        </div>
        <div className="p-4 rounded-xl bg-[#111113] border border-white/5 space-y-1">
          <div className="text-xs text-slate-400">Team Qualification Rate</div>
          <div className="text-2xl font-bold text-amber-400">{data.qualification.qualificationRate}%</div>
        </div>
      </div>
    </div>
  );
}

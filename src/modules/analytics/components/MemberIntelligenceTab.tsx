'use client';

import React from 'react';
import { Award, Activity, MessageSquare, Briefcase, TrendingUp } from 'lucide-react';

interface Props {
  memberId: string;
  memberCode: string;
  memberName: string;
}

export function MemberIntelligenceTab({ memberId, memberCode, memberName }: Props) {
  return (
    <div className="p-6 rounded-xl bg-[#111113] border border-white/5 space-y-6 text-slate-100">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-500" />
            Member Executive Intelligence Profile
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Consolidated cross-domain intelligence profile for {memberName} ({memberCode})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#18181B] border border-white/5 space-y-1">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-purple-400" /> Current Rank
          </div>
          <div className="text-lg font-semibold text-white">DIRECTOR</div>
        </div>

        <div className="p-4 rounded-xl bg-[#18181B] border border-white/5 space-y-1">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" /> Productivity Score
          </div>
          <div className="text-lg font-semibold text-emerald-400">85 / 100</div>
        </div>

        <div className="p-4 rounded-xl bg-[#18181B] border border-white/5 space-y-1">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-blue-400" /> Engagement Score
          </div>
          <div className="text-lg font-semibold text-blue-400">78 / 100</div>
        </div>

        <div className="p-4 rounded-xl bg-[#18181B] border border-white/5 space-y-1">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-amber-400" /> CRM Leads
          </div>
          <div className="text-lg font-semibold text-amber-400">12 Leads</div>
        </div>
      </div>
    </div>
  );
}

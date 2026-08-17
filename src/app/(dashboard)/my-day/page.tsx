import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getMyDayWorkspace } from '@/modules/productivity/service';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle2, Clock, Calendar, Zap, AlertTriangle, Target, Upload, BookOpen, Layers, ShieldCheck, Flame } from 'lucide-react';
import { MyDayWorkspaceClient } from '@/modules/productivity/components/MyDayWorkspaceClient';

export default async function MyDayPage() {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) {
    redirect('/login');
  }

  const userId = (session?.user as any).id;
  const member = await db.networkMember.findUnique({
    where: { userId },
  });

  if (!member) {
    return (
      <div className="p-8 text-center text-txt-muted">
        No active network member profile associated with account.
      </div>
    );
  }

  const myDayData = await getMyDayWorkspace(member.id);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-bg-surface via-wine-deep/40 to-bg-surface border border-wine-primary/60 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="wine">PRODUCTIVITY WORKSPACE</Badge>
            <span className="text-xs text-txt-muted font-mono">{myDayData.dateStr} ({myDayData.timeZone})</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">MY DAY WORKSPACE</h1>
          <p className="text-xs text-txt-muted">Personal daily execution, goals, task priorities, and evidence submission</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-bg-surface-elevated/60 border border-border-subtle flex items-center gap-3">
            <Flame className="w-6 h-6 text-amber-400 shrink-0 animate-pulse" />
            <div>
              <div className="text-[10px] text-txt-muted font-extrabold uppercase tracking-wider">Active Streak</div>
              <div className="text-lg font-black text-white">{myDayData.streakCount} Days</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-bg-surface-elevated/60 border border-wine-primary/40 flex items-center gap-3">
            <Zap className="w-6 h-6 text-wine-text shrink-0" />
            <div>
              <div className="text-[10px] text-txt-muted font-extrabold uppercase tracking-wider">Daily Score</div>
              <div className="text-lg font-black text-wine-text">{myDayData.dailyScore}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Attention Alerts */}
      {myDayData.attentionItems.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/60 space-y-2">
          <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Action Required
          </div>
          <ul className="space-y-1">
            {myDayData.attentionItems.map((item, idx) => (
              <li key={idx} className="text-xs text-amber-200/90 font-mono">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Interactive Client Workspace */}
      <MyDayWorkspaceClient myDayData={myDayData} />
    </div>
  );
}

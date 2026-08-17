'use client';

import React, { useState } from 'react';
import { DailyMyDayPayload } from '../types';
import { submitReportAction, submitEvidenceAction } from '../actions';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle2, Clock, Upload, Target, CheckSquare, Layers, FileText, Send } from 'lucide-react';

export interface MyDayWorkspaceClientProps {
  myDayData: DailyMyDayPayload;
}

export const MyDayWorkspaceClient: React.FC<MyDayWorkspaceClientProps> = ({ myDayData }) => {
  const [activities, setActivities] = useState(myDayData.activities);
  const [activeNotes, setActiveNotes] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const handleValueChange = (instanceId: string, val: number) => {
    setActivities((prev) =>
      prev.map((a) => (a.instanceId === instanceId ? { ...a, completedValue: val } : a))
    );
  };

  const handleReportSubmit = async (instanceId: string, completedValue: number) => {
    setSubmittingId(instanceId);
    try {
      const note = activeNotes[instanceId] || '';
      await submitReportAction(instanceId, completedValue, note);
      setActivities((prev) =>
        prev.map((a) =>
          a.instanceId === instanceId
            ? { ...a, status: completedValue >= a.targetValue ? 'VERIFIED' : 'REPORTED' }
            : a
        )
      );
    } catch (err: any) {
      alert(err.message || 'Report submission failed.');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Today's Activity Progress List */}
      <div className="p-6 rounded-2xl bg-bg-surface border border-border-subtle space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div>
            <h2 className="text-lg font-extrabold text-white">TODAY'S ACTIVITIES</h2>
            <p className="text-xs text-txt-muted">Daily target activity tracking and completion reporting</p>
          </div>
          <Badge variant="wine">{activities.length} ACTIVITIES ASSIGNED</Badge>
        </div>

        <div className="space-y-4">
          {activities.map((act) => {
            const isCompleted = act.completedValue >= act.targetValue;
            const pct = act.targetValue > 0 ? Math.min(100, Math.round((act.completedValue / act.targetValue) * 100)) : 0;

            return (
              <div
                key={act.instanceId}
                className="p-4 rounded-xl bg-bg-surface-elevated/40 border border-border-subtle hover:border-wine-primary/50 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                    )}
                    <div>
                      <div className="font-bold text-white text-sm">{act.activityTypeName}</div>
                      <div className="text-xs text-txt-muted">
                        Category: {act.category} | Unit: {act.measurementUnit}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-txt-muted">
                      Target: <strong className="text-white">{act.targetValue}</strong>
                    </span>
                    <Badge variant={isCompleted ? 'success' : 'warning'}>
                      {act.status}
                    </Badge>
                  </div>
                </div>

                {/* Progress Bar & Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center pt-2">
                  <div className="md:col-span-2 space-y-1">
                    <div className="flex justify-between text-[11px] font-mono text-txt-muted">
                      <span>Completed: {act.completedValue}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-wine-primary to-wine-accent rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={act.completedValue}
                      onChange={(e) => handleValueChange(act.instanceId, Number(e.target.value))}
                      className="w-20 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-mono text-xs text-center"
                    />
                    <button
                      onClick={() => handleReportSubmit(act.instanceId, act.completedValue)}
                      disabled={submittingId === act.instanceId}
                      className="px-3 py-1.5 rounded-lg bg-wine-primary hover:bg-wine-accent text-white text-xs font-bold transition-all flex items-center gap-1 shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Report
                    </button>
                  </div>

                  <div className="text-right">
                    {act.requiresEvidence && (
                      <span className="text-[11px] text-amber-300 font-mono flex items-center justify-end gap-1">
                        <Upload className="w-3.5 h-3.5" /> Proof Required
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Goals & Tasks Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Goals */}
        <div className="p-5 rounded-2xl bg-bg-surface border border-border-subtle space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-wine-text" />
              <h3 className="text-sm font-extrabold text-white uppercase">Active Goals</h3>
            </div>
            <Badge variant="outline">{myDayData.goals.length} Goals</Badge>
          </div>

          <div className="space-y-3">
            {myDayData.goals.map((g) => (
              <div key={g.id} className="p-3.5 rounded-xl bg-bg-surface-elevated/30 border border-border-subtle space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{g.title}</span>
                  <Badge variant="wine">{g.timeframe}</Badge>
                </div>
                <div className="flex justify-between text-[11px] text-txt-muted font-mono">
                  <span>Progress: {g.currentValue.toLocaleString()} / {g.targetValue.toLocaleString()} {g.unit}</span>
                  <span>{g.progressPercent}%</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${g.progressPercent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Item Tasks */}
        <div className="p-5 rounded-2xl bg-bg-surface border border-border-subtle space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-extrabold text-white uppercase">Today's Priority Tasks</h3>
            </div>
            <Badge variant="outline">{myDayData.tasks.length} Tasks</Badge>
          </div>

          <div className="space-y-2">
            {myDayData.tasks.map((t) => (
              <div key={t.id} className="p-3 rounded-lg bg-bg-surface-elevated/30 border border-border-subtle flex items-center justify-between text-xs">
                <span className="font-bold text-txt-primary">{t.title}</span>
                <Badge variant={t.priority === 'HIGH' || t.priority === 'URGENT' ? 'warning' : 'outline'}>
                  {t.priority}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

'use client';

import React from 'react';
import { NextRankProgressPayload } from '../types';
import { Badge } from '@/components/ui/Badge';
import { Award, Target, CheckCircle2, Clock, AlertCircle, ArrowUpRight, TrendingUp, DollarSign, Calendar, Users, Layers, Info } from 'lucide-react';

export interface MemberRankCockpitProps {
  progressData: NextRankProgressPayload;
  history?: any[];
}

export const MemberRankCockpit: React.FC<MemberRankCockpitProps> = ({ progressData, history = [] }) => {
  const {
    currentRank,
    achievedRank,
    qualifiedRank,
    nextRank,
    qualifiedStatus,
    pv,
    ppv,
    qpv,
    bv,
    svbRatePercent,
    consecutiveQualifyingMonths = 0,
    requirements,
    overallProgressPercent,
  } = progressData;

  const isQualified = qualifiedStatus === 'QUALIFIED';
  const isNotEvaluated = qualifiedStatus === 'NOT_YET_EVALUATED';

  const getStatusBadgeVariant = () => {
    if (isQualified) return 'success';
    if (isNotEvaluated) return 'outline';
    return 'warning';
  };

  const getStatusLabel = () => {
    if (isQualified) return 'QUALIFIED';
    if (isNotEvaluated) return 'NOT YET EVALUATED';
    return 'NOT QUALIFIED';
  };

  return (
    <div className="space-y-6">
      {/* Upper Cockpit Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Current & Achieved Rank Card */}
        <div className="p-5 rounded-xl bg-gradient-to-br from-bg-surface via-wine-deep/30 to-bg-surface border border-wine-primary/60 shadow-lg flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold tracking-widest text-txt-muted uppercase">EXECUTIVE RANK</span>
              <Badge variant={getStatusBadgeVariant()}>
                {getStatusLabel()}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-wine-primary/40 border border-wine-primary flex items-center justify-center text-amber-300 font-extrabold">
                L{achievedRank.level}
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">{achievedRank.displayName}</h3>
                <p className="text-xs text-txt-muted">Highest Achieved Rank</p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border-subtle/60 flex items-center justify-between text-xs">
            <span className="text-txt-muted">Current Period Status:</span>
            <span className={`font-bold ${isQualified ? 'text-emerald-400' : isNotEvaluated ? 'text-zinc-400' : 'text-amber-400'}`}>
              {qualifiedRank.displayName} ({getStatusLabel()})
            </span>
          </div>
        </div>

        {/* Current Period Volumes & SVB Rate */}
        <div className="p-5 rounded-xl bg-bg-surface border border-border-subtle space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-txt-muted uppercase tracking-wider">August 2026 Volume Summary</span>
            <Badge variant="wine">{svbRatePercent}% SVB RATE</Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-lg bg-bg-surface-elevated/40 border border-border-subtle">
              <div className="text-xs text-txt-muted">Personal PV (PPV)</div>
              <div className="text-lg font-extrabold text-txt-primary mt-0.5">{ppv.toLocaleString()}</div>
            </div>
            <div className="p-3 rounded-lg bg-bg-surface-elevated/40 border border-border-subtle">
              <div className="text-xs text-txt-muted">Qualified PV (QPV)</div>
              <div className="text-lg font-extrabold text-wine-text mt-0.5">{qpv.toLocaleString()}</div>
            </div>
            <div className="p-3 rounded-lg bg-bg-surface-elevated/40 border border-border-subtle">
              <div className="text-xs text-txt-muted">Bonus Volume (BV)</div>
              <div className="text-lg font-extrabold text-emerald-400 mt-0.5">${bv.toLocaleString()}</div>
            </div>
            <div className="p-3 rounded-lg bg-bg-surface-elevated/40 border border-border-subtle">
              <div className="text-xs text-txt-muted">SVB Rate</div>
              <div className="text-lg font-extrabold text-amber-300 mt-0.5">{svbRatePercent}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Emerald Director Consecutive Month Progress Indicator */}
      {nextRank?.code === 'EMERALD_DIRECTOR' || achievedRank.code === 'DIRECTOR' ? (
        <div className="p-4 rounded-xl bg-bg-surface border border-emerald-900/50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">Emerald Director Consecutive Qualifying Sequence</div>
              <div className="text-xs text-txt-muted">Requires 4,000 QPV for 3 consecutive qualifying months</div>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span className="text-lg font-extrabold text-emerald-400">{consecutiveQualifyingMonths} / 3</span>
            <span className="text-xs text-txt-muted">Months</span>
          </div>
        </div>
      ) : null}

      {/* Next Rank Advancement Progress Section */}
      {nextRank ? (
        <div className="p-5 rounded-xl bg-bg-surface border border-border-strong space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border-subtle">
            <div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-wine-text" />
                <span className="text-xs font-bold text-txt-muted uppercase tracking-wider">NEXT ACTIONABLE TARGET RANK</span>
              </div>
              <h2 className="text-xl font-extrabold text-white mt-0.5">Target: {nextRank.displayName}</h2>
            </div>
            <div className="text-right font-mono">
              <span className="text-2xl font-black text-wine-text">{overallProgressPercent}%</span>
              <div className="text-[10px] text-txt-muted uppercase">Overall Completion</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-txt-muted font-mono">
              <span>Current QPV: {qpv.toLocaleString()}</span>
              <span>Target Threshold: {requirements[0]?.threshold?.toLocaleString() || '4,000'}</span>
            </div>
            <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-zinc-800">
              <div
                className="h-full bg-gradient-to-r from-wine-primary to-wine-accent rounded-full transition-all duration-500 shadow-lg"
                style={{ width: `${Math.min(100, overallProgressPercent)}%` }}
              />
            </div>
          </div>

          {/* Detailed Requirements Checklist */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-txt-muted uppercase tracking-wider">Target Requirements Breakdown</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {requirements.map((req) => (
                <div
                  key={req.id}
                  className="p-3.5 rounded-lg bg-bg-surface-elevated/40 border border-border-subtle flex items-start gap-3"
                >
                  {req.status === 'COMPLETED' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-txt-primary truncate">{req.description}</span>
                      <Badge variant={req.status === 'COMPLETED' ? 'success' : 'warning'}>
                        {req.status}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-txt-muted mt-1 font-mono">
                      Current: {req.currentValue.toLocaleString()} / Target: {req.threshold.toLocaleString()}
                      {req.remainingValue > 0 && (
                        <span className="text-wine-text ml-2">({req.remainingValue.toLocaleString()} remaining)</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-xl bg-bg-surface border border-border-subtle text-center text-xs text-txt-muted">
          🌟 Highest configured rank achieved! No higher actionable rank requirement currently configured.
        </div>
      )}

      {/* Historical Rank Achievement Log */}
      {history.length > 0 && (
        <div className="p-5 rounded-xl bg-bg-surface border border-border-subtle space-y-3">
          <h4 className="text-xs font-bold text-txt-muted uppercase tracking-wider">Historical Rank Achievements</h4>
          <div className="space-y-2">
            {history.map((h) => (
              <div
                key={h.id}
                className="p-3 rounded-lg bg-bg-surface-elevated/30 border border-border-subtle flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <Award className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="font-bold text-txt-primary">{h.rank.displayName}</div>
                    <div className="text-[10px] text-txt-muted font-mono">{h.notes || 'Rank Achieved'}</div>
                  </div>
                </div>
                <span className="text-[11px] text-txt-muted font-mono">
                  {new Date(h.achievedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

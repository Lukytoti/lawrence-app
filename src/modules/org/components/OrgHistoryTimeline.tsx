import React from 'react';
import { OrgHistoryItem } from '../types';
import { Badge } from '@/components/ui/Badge';
import { Calendar, UserCheck, ArrowRight } from 'lucide-react';

export interface OrgHistoryTimelineProps {
  history: OrgHistoryItem[];
}

export const OrgHistoryTimeline: React.FC<OrgHistoryTimelineProps> = ({ history }) => {
  if (history.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-txt-muted border border-dashed border-border-subtle rounded-lg">
        No relationship history recorded.
      </div>
    );
  }

  return (
    <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-border-subtle">
      {history.map((item, idx) => {
        const isCurrent = !item.effectiveTo;
        return (
          <div key={item.id} className="relative flex items-start gap-4 pl-8">
            <div
              className={`absolute left-2.5 top-1.5 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 ${
                isCurrent ? 'bg-wine-primary border-wine-accent ring-2 ring-wine-primary/30' : 'bg-bg-surface-elevated border-zinc-600'
              }`}
            />
            <div className="flex-1 p-3 rounded-lg bg-bg-surface border border-border-subtle text-xs space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-wine-text" />
                  <span className="font-bold text-txt-primary">
                    {item.sponsor ? `${item.sponsor.name} (${item.sponsor.memberCode})` : 'Root Admin'}
                  </span>
                </div>
                {isCurrent ? <Badge variant="success">Current Sponsor</Badge> : <Badge variant="outline">Historical</Badge>}
              </div>

              <div className="flex items-center gap-2 text-[11px] text-txt-muted font-mono">
                <Calendar className="w-3 h-3 text-txt-muted" />
                <span>
                  {new Date(item.effectiveFrom).toLocaleDateString()}
                  {item.effectiveTo ? ` — ${new Date(item.effectiveTo).toLocaleDateString()}` : ' — Present'}
                </span>
              </div>

              {item.reason && (
                <div className="text-[11px] text-zinc-400 bg-bg-surface-elevated/40 px-2.5 py-1 rounded border border-border-subtle/50">
                  Reason: {item.reason}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

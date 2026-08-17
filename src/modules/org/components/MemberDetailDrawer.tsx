'use client';

import React from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { NetworkMemberNode, UplineChainItem } from '../types';
import { ExternalLink, GitBranch, ArrowUpRight, UserX, Shield, Award, Activity, DollarSign, Target, BookOpen, Layers } from 'lucide-react';
import Link from 'next/link';

export interface MemberDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  member: NetworkMemberNode | null;
  uplineChain?: UplineChainItem[];
  onOpenMove?: () => void;
  onOpenExit?: () => void;
}

export const MemberDetailDrawer: React.FC<MemberDetailDrawerProps> = ({
  isOpen,
  onClose,
  member,
  uplineChain = [],
  onOpenMove,
  onOpenExit,
}) => {
  if (!member) return null;

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PROSPECT':
        return 'info';
      case 'INACTIVE':
      case 'AT_RISK':
        return 'warning';
      case 'EXITED':
      case 'ARCHIVED':
        return 'wine';
      default:
        return 'default';
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={`Member Details — ${member.memberCode}`} side="right">
      <div className="space-y-6">
        {/* Profile Card Header */}
        <div className="p-4 rounded-xl bg-bg-surface-elevated/80 border border-border-subtle flex items-start gap-4 shadow-sm">
          <Avatar src={member.avatarUrl} name={member.name} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-bold text-txt-primary truncate">{member.name}</h3>
              <Badge variant={getStatusVariant(member.status)}>{member.status}</Badge>
            </div>
            <p className="text-xs text-txt-muted truncate">{member.email}</p>
            <div className="flex items-center gap-2 mt-2 text-[11px] text-zinc-400 font-mono">
              <span>Code: {member.memberCode}</span>
              <span>•</span>
              <span>Joined: {new Date(member.joinedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Link href={`/network/members/${member.id}`} onClick={onClose}>
            <Button variant="secondary" size="sm" className="w-full justify-between" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
              Full Profile
            </Button>
          </Link>
          {onOpenMove && (
            <Button variant="outline" size="sm" onClick={onOpenMove} leftIcon={<GitBranch className="w-3.5 h-3.5 text-wine-text" />}>
              Move Sponsor
            </Button>
          )}
        </div>

        {/* Organization Summary */}
        <div className="p-4 rounded-xl bg-bg-surface border border-border-subtle space-y-3">
          <h4 className="text-xs font-bold text-txt-muted uppercase tracking-wider">Organization Structure</h4>
          
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-2.5 rounded-lg bg-bg-surface-elevated/40 border border-border-subtle">
              <div className="text-lg font-extrabold text-txt-primary">{member.directDownlineCount}</div>
              <div className="text-[10px] text-txt-muted">Direct Downlines</div>
            </div>
            <div className="p-2.5 rounded-lg bg-bg-surface-elevated/40 border border-border-subtle">
              <div className="text-lg font-extrabold text-wine-text">{member.totalDownlineCount}</div>
              <div className="text-[10px] text-txt-muted">Total Org Count</div>
            </div>
          </div>

          {/* Upline Chain Preview */}
          {uplineChain.length > 0 && (
            <div className="pt-2 border-t border-border-subtle/50 space-y-2">
              <div className="text-[11px] font-semibold text-txt-muted flex items-center justify-between">
                <span>Upline Hierarchy</span>
                <span className="font-mono text-[10px]">{uplineChain.length} levels</span>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {uplineChain.map((up) => (
                  <div key={up.id} className="flex items-center justify-between px-2.5 py-1.5 rounded bg-bg-surface-elevated/30 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <ArrowUpRight className="w-3 h-3 text-wine-text shrink-0" />
                      <span className="font-medium text-txt-primary truncate">{up.name}</span>
                    </div>
                    <span className="text-[10px] text-txt-muted font-mono shrink-0">Level {up.level}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reserved Module Tabs Placeholders */}
        <div className="space-y-3 pt-2 border-t border-border-subtle">
          <h4 className="text-xs font-bold text-txt-muted uppercase tracking-wider">Domain Module Status</h4>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg bg-bg-surface border border-border-subtle text-left flex items-center gap-2 opacity-60">
              <Award className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-txt-primary">Rank Engine</div>
                <div className="text-[10px] text-txt-muted">Reserved Phase 3</div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-bg-surface border border-border-subtle text-left flex items-center gap-2 opacity-60">
              <Activity className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-txt-primary">Activities</div>
                <div className="text-[10px] text-txt-muted">Reserved Phase 4</div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-bg-surface border border-border-subtle text-left flex items-center gap-2 opacity-60">
              <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-txt-primary">Earnings</div>
                <div className="text-[10px] text-txt-muted">Reserved Phase 7</div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-bg-surface border border-border-subtle text-left flex items-center gap-2 opacity-60">
              <Target className="w-4 h-4 text-wine-text shrink-0" />
              <div>
                <div className="text-xs font-semibold text-txt-primary">Goals</div>
                <div className="text-[10px] text-txt-muted">Reserved Phase 4</div>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone Actions */}
        {onOpenExit && member.status !== 'EXITED' && (
          <div className="pt-4 border-t border-border-subtle">
            <Button variant="danger" size="sm" className="w-full" onClick={onOpenExit} leftIcon={<UserX className="w-3.5 h-3.5" />}>
              Mark Member as Exited
            </Button>
          </div>
        )}
      </div>
    </Drawer>
  );
};

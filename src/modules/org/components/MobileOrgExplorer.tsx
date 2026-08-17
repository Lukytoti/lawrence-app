'use client';

import React, { useState } from 'react';
import { NetworkMemberNode } from '../types';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ChevronRight, ArrowUpRight, Users, User, Shield } from 'lucide-react';
import { fetchDownlinesAction } from '../actions';

export interface MobileOrgExplorerProps {
  rootNode: NetworkMemberNode;
  onSelectMember: (member: NetworkMemberNode) => void;
}

export const MobileOrgExplorer: React.FC<MobileOrgExplorerProps> = ({
  rootNode,
  onSelectMember,
}) => {
  const [currentMember, setCurrentMember] = useState<NetworkMemberNode>(rootNode);
  const [downlines, setDownlines] = useState<NetworkMemberNode[]>(rootNode.children || []);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<NetworkMemberNode[]>([rootNode]);

  const handleNavigateDown = async (node: NetworkMemberNode) => {
    setIsLoading(true);
    try {
      const children = await fetchDownlinesAction(node.id);
      setCurrentMember({ ...node, children });
      setDownlines(children);
      setHistory((prev) => [...prev, node]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateBreadcrumb = async (targetNode: NetworkMemberNode, index: number) => {
    setIsLoading(true);
    try {
      const children = await fetchDownlinesAction(targetNode.id);
      setCurrentMember({ ...targetNode, children });
      setDownlines(children);
      setHistory((prev) => prev.slice(0, index + 1));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 md:hidden">
      {/* Mobile Breadcrumb */}
      <div className="flex items-center gap-1 overflow-x-auto text-xs py-1 border-b border-border-subtle text-txt-muted font-mono">
        {history.map((h, i) => (
          <React.Fragment key={h.id}>
            {i > 0 && <ChevronRight className="w-3 h-3 text-txt-muted shrink-0" />}
            <button
              onClick={() => handleNavigateBreadcrumb(h, i)}
              className={`hover:underline truncate max-w-[100px] ${
                i === history.length - 1 ? 'font-bold text-wine-text' : 'text-txt-muted'
              }`}
            >
              {h.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Current Focused Member Card */}
      <div
        onClick={() => onSelectMember(currentMember)}
        className="p-4 rounded-xl bg-gradient-to-r from-bg-surface via-wine-deep/30 to-bg-surface border border-wine-primary/60 shadow-lg cursor-pointer"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar src={currentMember.avatarUrl} name={currentMember.name} size="md" />
            <div>
              <h3 className="text-base font-bold text-txt-primary">{currentMember.name}</h3>
              <p className="text-xs text-txt-muted font-mono">{currentMember.memberCode}</p>
            </div>
          </div>
          <Badge variant="wine">{currentMember.status}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-border-subtle text-center">
          <div>
            <div className="text-sm font-bold text-txt-primary">{currentMember.directDownlineCount}</div>
            <div className="text-[10px] text-txt-muted">Direct Downlines</div>
          </div>
          <div>
            <div className="text-sm font-bold text-wine-text">{currentMember.totalDownlineCount}</div>
            <div className="text-[10px] text-txt-muted">Total Org</div>
          </div>
        </div>
      </div>

      {/* Direct Downline Mobile List */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-txt-muted uppercase tracking-wider">Direct Downlines</h4>
          <span className="text-xs text-txt-muted font-mono">{downlines.length} members</span>
        </div>

        {downlines.length === 0 ? (
          <div className="p-6 text-center text-xs text-txt-muted border border-dashed border-border-subtle rounded-lg">
            No direct downlines under {currentMember.name}.
          </div>
        ) : (
          <div className="space-y-2">
            {downlines.map((child) => (
              <div
                key={child.id}
                className="p-3 rounded-lg bg-bg-surface border border-border-subtle flex items-center justify-between hover:bg-bg-surface-elevated transition"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0" onClick={() => onSelectMember(child)}>
                  <Avatar src={child.avatarUrl} name={child.name} size="sm" />
                  <div className="truncate">
                    <div className="text-xs font-semibold text-txt-primary truncate">{child.name}</div>
                    <div className="text-[10px] text-txt-muted font-mono">{child.memberCode}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {child.hasChildren && (
                    <button
                      onClick={() => handleNavigateDown(child)}
                      className="p-1.5 rounded bg-zinc-800 hover:bg-wine-deep text-txt-muted hover:text-white text-xs flex items-center gap-1"
                    >
                      <span>Sub-tree</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

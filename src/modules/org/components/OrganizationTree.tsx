'use client';

import React, { useState } from 'react';
import { NetworkMemberNode } from '../types';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ChevronRight, ChevronDown, Users, Shield, Loader2, Award } from 'lucide-react';
import { fetchDownlinesAction } from '../actions';

export interface OrganizationTreeProps {
  rootNode: NetworkMemberNode;
  onSelectMember: (member: NetworkMemberNode) => void;
  selectedMemberId?: string;
}

const TreeNode: React.FC<{
  node: NetworkMemberNode;
  depth: number;
  onSelectMember: (node: NetworkMemberNode) => void;
  selectedMemberId?: string;
}> = ({ node, depth, onSelectMember, selectedMemberId }) => {
  const [isExpanded, setIsExpanded] = useState(depth === 0);
  const [children, setChildren] = useState<NetworkMemberNode[]>(node.children || []);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(!!node.children && node.children.length > 0);

  const toggleExpand = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isExpanded && !hasLoaded && node.hasChildren) {
      setIsLoading(true);
      try {
        const fetched = await fetchDownlinesAction(node.id);
        setChildren(fetched);
        setHasLoaded(true);
      } catch (err) {
        console.error('Failed to load downlines:', err);
      } finally {
        setIsLoading(false);
      }
    }
    setIsExpanded(!isExpanded);
  };

  const isSelected = selectedMemberId === node.id;

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
    <div className="flex flex-col items-start my-1 relative">
      {/* Node Card */}
      <div
        onClick={() => onSelectMember(node)}
        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all duration-150 cursor-pointer select-none group ${
          isSelected
            ? 'bg-wine-deep/90 border-wine-primary ring-2 ring-wine-primary/40 shadow-lg'
            : 'bg-bg-surface border-border-subtle hover:border-border-strong hover:bg-bg-surface-elevated/70'
        }`}
      >
        {/* Expand / Collapse Button */}
        {node.hasChildren ? (
          <button
            onClick={toggleExpand}
            className="p-1 rounded hover:bg-zinc-800 text-txt-muted hover:text-white transition"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-wine-text" />
            ) : isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}

        <Avatar src={node.avatarUrl} name={node.name} size="sm" />

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-txt-primary group-hover:text-white">{node.name}</span>
            <Badge variant={getStatusVariant(node.status)}>{node.status}</Badge>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-txt-muted font-mono mt-0.5">
            <span>{node.memberCode}</span>
            <span>•</span>
            <span className="text-wine-text font-medium">{node.roleName || 'MEMBER'}</span>
          </div>
        </div>

        {/* Downline Counts */}
        <div className="flex items-center gap-2 ml-4 pl-3 border-l border-border-subtle text-[11px] text-txt-muted shrink-0">
          <div className="flex items-center gap-1" title="Direct Downlines">
            <Users className="w-3 h-3 text-txt-muted" />
            <span className="font-mono text-txt-primary">{node.directDownlineCount}</span>
          </div>
          {node.totalDownlineCount > 0 && (
            <div className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-wine-text border border-zinc-700" title="Total Organization Count">
              {node.totalDownlineCount} total
            </div>
          )}
        </div>
      </div>

      {/* Children Tree Branch */}
      {isExpanded && children.length > 0 && (
        <div className="pl-6 ml-4 border-l-2 border-border-subtle/80 space-y-1 mt-1 pt-1">
          {children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onSelectMember={onSelectMember}
              selectedMemberId={selectedMemberId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const OrganizationTree: React.FC<OrganizationTreeProps> = ({
  rootNode,
  onSelectMember,
  selectedMemberId,
}) => {
  return (
    <div className="p-4 rounded-xl bg-bg-surface/60 border border-border-subtle overflow-x-auto min-h-[400px]">
      <TreeNode
        node={rootNode}
        depth={0}
        onSelectMember={onSelectMember}
        selectedMemberId={selectedMemberId}
      />
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import { NetworkMemberNode, NetworkMemberSummary, UplineChainItem } from '@/modules/org/types';
import { OrganizationTree } from '@/modules/org/components/OrganizationTree';
import { MobileOrgExplorer } from '@/modules/org/components/MobileOrgExplorer';
import { MemberDetailDrawer } from '@/modules/org/components/MemberDetailDrawer';
import { MemberCreateModal } from '@/modules/org/components/MemberCreateModal';
import { MemberMoveModal } from '@/modules/org/components/MemberMoveModal';
import { MemberExitModal } from '@/modules/org/components/MemberExitModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { UserPlus, Search, GitFork, GitBranch, RefreshCw } from 'lucide-react';
import { searchMembersAction } from '@/modules/org/actions';

export interface OrganizationExplorerClientProps {
  rootNode: NetworkMemberNode;
  allSponsors: NetworkMemberSummary[];
}

export const OrganizationExplorerClient: React.FC<OrganizationExplorerClientProps> = ({
  rootNode,
  allSponsors,
}) => {
  const [selectedMember, setSelectedMember] = useState<NetworkMemberNode | null>(rootNode);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NetworkMemberSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSelectMember = (member: NetworkMemberNode) => {
    setSelectedMember(member);
    setIsDrawerOpen(true);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await searchMembersAction(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-widest text-txt-muted uppercase">NETWORK MARKETING</span>
            <Badge variant="wine">EFFECTIVE-DATED HIERARCHY</Badge>
          </div>
          <h1 className="text-2xl font-extrabold text-txt-primary">Organization Explorer</h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Create Member
          </Button>
        </div>
      </div>

      {/* Member Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Search member by name, code (e.g. NM-10001), email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4 text-txt-muted" />}
        />
        <Button type="submit" variant="secondary" size="sm" isLoading={isSearching}>
          Search
        </Button>
      </form>

      {/* Search Results Dropdown/Card */}
      {searchResults.length > 0 && (
        <div className="p-4 rounded-xl bg-bg-surface border border-border-strong space-y-2">
          <div className="flex items-center justify-between text-xs text-txt-muted">
            <span>Search Results ({searchResults.length})</span>
            <button onClick={() => setSearchResults([])} className="hover:underline text-wine-text">Clear</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {searchResults.map((res) => (
              <div
                key={res.id}
                onClick={() => handleSelectMember({ ...res, hasChildren: res.directDownlineCount > 0 })}
                className="p-3 rounded-lg bg-bg-surface-elevated/40 border border-border-subtle hover:border-wine-primary cursor-pointer transition text-xs flex items-center gap-3"
              >
                <div>
                  <div className="font-bold text-txt-primary">{res.name}</div>
                  <div className="text-[10px] text-txt-muted font-mono">{res.memberCode} • Sponsor: {res.sponsor?.name || 'Root'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Desktop Visual Tree */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-txt-muted uppercase tracking-wider">Visual Network Tree (Interactive)</span>
          <span className="text-xs text-txt-muted">Click node to inspect details</span>
        </div>
        <OrganizationTree
          rootNode={rootNode}
          onSelectMember={handleSelectMember}
          selectedMemberId={selectedMember?.id}
        />
      </div>

      {/* Mobile Organization Explorer */}
      <div className="md:hidden">
        <MobileOrgExplorer rootNode={rootNode} onSelectMember={handleSelectMember} />
      </div>

      {/* Modals & Detail Drawer */}
      <MemberDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        member={selectedMember}
        onOpenMove={() => setIsMoveModalOpen(true)}
        onOpenExit={() => setIsExitModalOpen(true)}
      />

      <MemberCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        allSponsors={allSponsors}
      />

      <MemberMoveModal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        member={selectedMember}
        allSponsors={allSponsors}
      />

      <MemberExitModal
        isOpen={isExitModalOpen}
        onClose={() => setIsExitModalOpen(false)}
        member={selectedMember}
      />
    </div>
  );
};

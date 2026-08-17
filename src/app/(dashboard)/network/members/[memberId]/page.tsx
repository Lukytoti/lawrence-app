import React from 'react';
import { db } from '@/lib/db';
import { getCurrentSponsor, getUplineChain, getMemberOrgHistory, getTotalDownlineCount } from '@/modules/org/service';
import { getRankProgress, getRankHistory } from '@/modules/ranks/service';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { OrgHistoryTimeline } from '@/modules/org/components/OrgHistoryTimeline';
import { MemberRankCockpit } from '@/modules/ranks/components/MemberRankCockpit';
import { notFound } from 'next/navigation';
import { Award, Activity, DollarSign, Target, BookOpen, FolderKanban, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function MemberProfilePage({ params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;

  const member = await db.networkMember.findUnique({
    where: { id: memberId },
    include: {
      user: {
        include: {
          profile: true,
          userRoles: { include: { role: true } },
        },
      },
    },
  });

  if (!member) {
    notFound();
  }

  const sponsor = await getCurrentSponsor(member.id);
  const upline = await getUplineChain(member.id);
  const history = await getMemberOrgHistory(member.id);
  const directCount = await db.organizationRelationship.count({
    where: { sponsorId: member.id, effectiveTo: null, relationshipType: 'SPONSOR' },
  });
  const totalCount = await getTotalDownlineCount(member.id);

  // Fetch Rank Engine data
  const rankProgress = await getRankProgress(member.id);
  const rankHistory = await getRankHistory(member.id);

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
    <div className="space-y-6">
      {/* Header Profile Banner */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-bg-surface via-wine-deep/40 to-bg-surface border border-border-strong shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar
              src={member.user.profile?.avatarUrl}
              name={member.user.profile?.displayName || member.user.name || member.user.email}
              size="lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-white">
                  {member.user.profile?.displayName || member.user.name}
                </h1>
                <Badge variant={getStatusVariant(member.status)}>{member.status}</Badge>
                <Badge variant="wine">{rankProgress.achievedRank.displayName}</Badge>
              </div>
              <p className="text-xs text-txt-muted mt-0.5">{member.user.email}</p>
              <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono mt-2">
                <span>Code: <strong className="text-wine-text">{member.memberCode}</strong></span>
                <span>•</span>
                <span>Role: {member.user.userRoles[0]?.role?.name || 'MEMBER'}</span>
                <span>•</span>
                <span>Joined: {new Date(member.joinedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-border-subtle pt-3 md:pt-0 md:pl-6 text-center">
            <div>
              <div className="text-xl font-extrabold text-txt-primary">{directCount}</div>
              <div className="text-[10px] text-txt-muted uppercase">Direct Downlines</div>
            </div>
            <div className="h-8 w-px bg-border-subtle" />
            <div>
              <div className="text-xl font-extrabold text-wine-text">{totalCount}</div>
              <div className="text-[10px] text-txt-muted uppercase">Total Org</div>
            </div>
          </div>
        </div>
      </div>

      {/* Rank & Qualification Cockpit Section */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-txt-muted uppercase tracking-wider">
          Rank & Qualification Cockpit
        </h2>
        <MemberRankCockpit progressData={rankProgress} history={rankHistory} />
      </div>

      {/* Grid Layout: Overview & History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Organization Summary & Upline */}
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-bg-surface border border-border-subtle space-y-3">
            <h3 className="text-xs font-bold text-txt-muted uppercase tracking-wider">Sponsorship Overview</h3>
            <div className="p-3 rounded-lg bg-bg-surface-elevated/40 border border-border-subtle text-xs space-y-1">
              <span className="text-txt-muted">Direct Sponsor:</span>
              <div className="font-bold text-txt-primary mt-0.5">
                {sponsor ? `${sponsor.name} (${sponsor.memberCode})` : 'Root Admin (Top of Network)'}
              </div>
            </div>

            <div className="pt-2 border-t border-border-subtle/50">
              <div className="text-[11px] font-semibold text-txt-muted mb-2">Upline Ancestor Chain ({upline.length})</div>
              {upline.length === 0 ? (
                <span className="text-xs text-txt-muted italic">Top of Network (No Upline)</span>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {upline.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-2 rounded bg-bg-surface-elevated/30 text-xs">
                      <span className="font-medium text-txt-primary truncate">{u.name}</span>
                      <span className="text-[10px] text-txt-muted font-mono">Level {u.level}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Middle & Right Column: Effective-Dated History & Future Module Tabs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-4 rounded-xl bg-bg-surface border border-border-subtle space-y-4">
            <h3 className="text-xs font-bold text-txt-muted uppercase tracking-wider">
              Effective-Dated Organization History
            </h3>
            <OrgHistoryTimeline history={history} />
          </div>
        </div>
      </div>
    </div>
  );
}

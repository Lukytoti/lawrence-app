import React from 'react';
import { db } from '@/lib/db';
import { getDirectDownlines, getUplineChain, getTotalDownlineCount, searchMembers } from '@/modules/org/service';
import { OrganizationExplorerClient } from './OrganizationExplorerClient';
import { NetworkMemberNode, NetworkMemberSummary } from '@/modules/org/types';

export const dynamic = 'force-dynamic';

export default async function OrganizationPage() {
  // Find Root Admin member (Oluwatobi)
  const rootMember = await db.networkMember.findFirst({
    where: { status: 'ACTIVE' },
    orderBy: { joinedAt: 'asc' },
    include: {
      user: {
        include: {
          profile: true,
          userRoles: { include: { role: true } },
        },
      },
    },
  });

  if (!rootMember) {
    return (
      <div className="p-8 text-center text-txt-muted">
        No root network member found. Please run seed script.
      </div>
    );
  }

  const directCount = await db.organizationRelationship.count({
    where: { sponsorId: rootMember.id, effectiveTo: null, relationshipType: 'SPONSOR' },
  });
  const totalCount = await getTotalDownlineCount(rootMember.id);
  const initialChildren = await getDirectDownlines(rootMember.id);

  const rootNode: NetworkMemberNode = {
    id: rootMember.id,
    memberCode: rootMember.memberCode,
    userId: rootMember.userId,
    name: rootMember.user.profile?.displayName || rootMember.user.name || rootMember.user.email,
    email: rootMember.user.email,
    avatarUrl: rootMember.user.profile?.avatarUrl,
    phone: rootMember.user.profile?.phone,
    status: rootMember.status as any,
    joinedAt: rootMember.joinedAt,
    activatedAt: rootMember.activatedAt,
    roleName: rootMember.user.userRoles[0]?.role?.name || 'SUPER_ADMIN',
    directDownlineCount: directCount,
    totalDownlineCount: totalCount,
    hasChildren: directCount > 0,
    children: initialChildren,
  };

  // Fetch all members list for sponsor selection dropdowns
  const allSponsorsList = await searchMembers('', 100);

  return <OrganizationExplorerClient rootNode={rootNode} allSponsors={allSponsorsList} />;
}

import { db } from '@/lib/db';
import { eventBus } from '@/lib/events';
import { logAuditEvent } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';
import {
  NetworkMemberSummary,
  NetworkMemberNode,
  UplineChainItem,
  OrgHistoryItem,
  OrgMetricsSummary,
  CreateMemberPayload,
} from './types';

/**
 * Get the Root Network Member of the Organization tree (where sponsorId is null).
 * Decoupled from SUPER_ADMIN RBAC role.
 */
export async function getRootNetworkMember() {
  const rootRel = await db.organizationRelationship.findFirst({
    where: {
      sponsorId: null,
      effectiveTo: null,
      relationshipType: 'SPONSOR',
    },
    include: {
      member: {
        include: {
          user: {
            include: {
              profile: true,
              userRoles: { include: { role: true } },
            },
          },
        },
      },
    },
    orderBy: { effectiveFrom: 'asc' },
  });

  return rootRel?.member || null;
}

/**
 * Get active sponsor of a network member.
 */
export async function getCurrentSponsor(memberId: string) {
  const activeRel = await db.organizationRelationship.findFirst({
    where: {
      memberId,
      effectiveTo: null,
      relationshipType: 'SPONSOR',
    },
    include: {
      sponsor: {
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
      },
    },
  });

  if (!activeRel || !activeRel.sponsor) return null;

  return {
    id: activeRel.sponsor.id,
    memberCode: activeRel.sponsor.memberCode,
    name: activeRel.sponsor.user.profile?.displayName || activeRel.sponsor.user.name || activeRel.sponsor.user.email,
    email: activeRel.sponsor.user.email,
  };
}

/**
 * Fetch direct downline network members for a given sponsor (Level 1).
 */
export async function getDirectDownlines(sponsorId: string): Promise<NetworkMemberNode[]> {
  const activeRels = await db.organizationRelationship.findMany({
    where: {
      sponsorId,
      effectiveTo: null,
      relationshipType: 'SPONSOR',
    },
    include: {
      member: {
        include: {
          user: {
            include: {
              profile: true,
              userRoles: { include: { role: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const nodes: NetworkMemberNode[] = [];

  for (const rel of activeRels) {
    const m = rel.member;
    const directCount = await db.organizationRelationship.count({
      where: {
        sponsorId: m.id,
        effectiveTo: null,
        relationshipType: 'SPONSOR',
      },
    });

    const totalCount = await getTotalDownlineCount(m.id);

    nodes.push({
      id: m.id,
      memberCode: m.memberCode,
      userId: m.userId,
      name: m.user.profile?.displayName || m.user.name || m.user.email,
      email: m.user.email,
      avatarUrl: m.user.profile?.avatarUrl,
      phone: m.user.profile?.phone,
      status: m.status as any,
      joinedAt: m.joinedAt,
      activatedAt: m.activatedAt,
      exitedAt: m.exitedAt,
      exitReason: m.exitReason,
      archivedAt: m.archivedAt,
      roleName: m.user.userRoles[0]?.role?.name || 'MEMBER',
      directDownlineCount: directCount,
      totalDownlineCount: totalCount,
      hasChildren: directCount > 0,
    });
  }

  return nodes;
}

/**
 * Get entire upline ancestor chain from direct sponsor up to root Super Admin.
 * Order: Direct Sponsor (Level 1) -> Grand Sponsor (Level 2) -> ... -> Root Admin.
 * Optimized via PostgreSQL Recursive CTE for 100,000+ member performance.
 */
export async function getUplineChain(memberId: string): Promise<UplineChainItem[]> {
  const rawUpline: Array<{
    id: string;
    memberCode: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    status: string;
    level: number;
    effectiveFrom: Date;
  }> = await db.$queryRaw`
    WITH RECURSIVE upline AS (
      SELECT 
        m."id",
        m."memberCode",
        u."email",
        COALESCE(p."displayName", u."name", u."email") as name,
        p."avatarUrl",
        m."status",
        1 as level,
        r."effectiveFrom",
        r."sponsorId"
      FROM "OrganizationRelationship" r
      INNER JOIN "NetworkMember" m ON m."id" = r."sponsorId"
      INNER JOIN "User" u ON u."id" = m."userId"
      LEFT JOIN "Profile" p ON p."userId" = u."id"
      WHERE r."memberId" = ${memberId}
        AND r."effectiveTo" IS NULL
        AND r."relationshipType" = 'SPONSOR'

      UNION ALL

      SELECT 
        m."id",
        m."memberCode",
        u."email",
        COALESCE(p."displayName", u."name", u."email") as name,
        p."avatarUrl",
        m."status",
        up.level + 1 as level,
        r."effectiveFrom",
        r."sponsorId"
      FROM "OrganizationRelationship" r
      INNER JOIN upline up ON r."memberId" = up."id"
      INNER JOIN "NetworkMember" m ON m."id" = r."sponsorId"
      INNER JOIN "User" u ON u."id" = m."userId"
      LEFT JOIN "Profile" p ON p."userId" = u."id"
      WHERE r."effectiveTo" IS NULL
        AND r."relationshipType" = 'SPONSOR'
    )
    SELECT id, "memberCode", email, name, "avatarUrl", status, level, "effectiveFrom"
    FROM upline
    ORDER BY level ASC;
  `;

  return rawUpline.map((row) => ({
    id: row.id,
    memberCode: row.memberCode,
    name: row.name,
    email: row.email,
    avatarUrl: row.avatarUrl,
    status: row.status as any,
    level: Number(row.level),
    effectiveFrom: row.effectiveFrom,
  }));
}

/**
 * Calculate total downstream organization count.
 * Optimized via PostgreSQL Recursive CTE for 100,000+ member performance.
 */
export async function getTotalDownlineCount(memberId: string): Promise<number> {
  const result: Array<{ count: bigint }> = await db.$queryRaw`
    WITH RECURSIVE downline AS (
      SELECT "memberId"
      FROM "OrganizationRelationship"
      WHERE "sponsorId" = ${memberId}
        AND "effectiveTo" IS NULL
        AND "relationshipType" = 'SPONSOR'
      
      UNION ALL
      
      SELECT r."memberId"
      FROM "OrganizationRelationship" r
      INNER JOIN downline d ON r."sponsorId" = d."memberId"
      WHERE r."effectiveTo" IS NULL
        AND r."relationshipType" = 'SPONSOR'
    )
    SELECT COUNT(*)::bigint as count FROM downline;
  `;

  return Number(result[0]?.count || 0);
}

/**
 * Get array of all downstream member IDs for a sponsor.
 * Optimized via PostgreSQL Recursive CTE.
 */
export async function getDownlineMemberIds(sponsorId: string): Promise<string[]> {
  const result: Array<{ memberId: string }> = await db.$queryRaw`
    WITH RECURSIVE downline AS (
      SELECT "memberId"
      FROM "OrganizationRelationship"
      WHERE "sponsorId" = ${sponsorId}
        AND "effectiveTo" IS NULL
        AND "relationshipType" = 'SPONSOR'
      
      UNION ALL
      
      SELECT r."memberId"
      FROM "OrganizationRelationship" r
      INNER JOIN downline d ON r."sponsorId" = d."memberId"
      WHERE r."effectiveTo" IS NULL
        AND r."relationshipType" = 'SPONSOR'
    )
    SELECT "memberId" FROM downline;
  `;

  return result.map((r) => r.memberId);
}

/**
 * Validate that moving `memberId` under `newSponsorId` will NOT create a circular relationship.
 */
export async function validateMoveNotCycle(
  memberId: string,
  newSponsorId: string
): Promise<{ valid: boolean; reason?: string }> {
  if (memberId === newSponsorId) {
    return { valid: false, reason: 'A member cannot sponsor themselves.' };
  }

  // Check if newSponsorId is a descendant of memberId
  let checkSponsorId: string | null = newSponsorId;
  const visited = new Set<string>();

  while (checkSponsorId) {
    if (checkSponsorId === memberId) {
      return {
        valid: false,
        reason: 'Invalid movement: Target sponsor is a downstream member of this node (circular relationship).',
      };
    }
    visited.add(checkSponsorId);

    const rel: { sponsorId: string | null } | null = await db.organizationRelationship.findFirst({
      where: {
        memberId: checkSponsorId,
        effectiveTo: null,
        relationshipType: 'SPONSOR',
      },
      select: { sponsorId: true },
    });

    if (!rel || !rel.sponsorId || visited.has(rel.sponsorId)) {
      break;
    }
    checkSponsorId = rel.sponsorId;
  }

  return { valid: true };
}

/**
 * Move a member under a new sponsor with effective-dated historical preservation.
 */
export async function moveMemberSponsor(
  memberId: string,
  newSponsorId: string,
  reason: string,
  actorId: string
) {
  const validation = await validateMoveNotCycle(memberId, newSponsorId);
  if (!validation.valid) {
    throw new Error(validation.reason);
  }

  const now = new Date();

  // 1. Close current active relationship
  await db.organizationRelationship.updateMany({
    where: {
      memberId,
      effectiveTo: null,
      relationshipType: 'SPONSOR',
    },
    data: {
      effectiveTo: now,
    },
  });

  // 2. Create new active relationship
  const newRel = await db.organizationRelationship.create({
    data: {
      memberId,
      sponsorId: newSponsorId,
      relationshipType: 'SPONSOR',
      effectiveFrom: now,
      reason,
      createdBy: actorId,
    },
    include: {
      member: { include: { user: true } },
      sponsor: { include: { user: true } },
    },
  });

  // 3. Emit Application Event & Audit Log
  await eventBus.publish(
    'MemberMoved',
    {
      memberId,
      oldSponsorId: newRel.sponsorId,
      newSponsorId,
      reason,
    },
    actorId
  );

  await logAuditEvent({
    actorId,
    action: 'MEMBER_MOVED',
    entityType: 'NetworkMember',
    entityId: memberId,
    metadata: {
      memberCode: newRel.member.memberCode,
      newSponsorId,
      reason,
    },
  });

  // 4. Notify member and new sponsor
  await createNotification({
    userId: newRel.member.userId,
    title: 'Sponsor Assignment Updated',
    message: `Your organization sponsor has been updated. Reason: ${reason}`,
    type: 'INFO',
    link: '/network/organization',
  });

  return newRel;
}

/**
 * Mark a network member as Exited.
 */
export async function exitMember(memberId: string, exitReason: string, actorId: string) {
  const now = new Date();

  const member = await db.networkMember.update({
    where: { id: memberId },
    data: {
      status: 'EXITED',
      exitedAt: now,
      exitReason,
      updatedBy: actorId,
    },
    include: { user: true },
  });

  await eventBus.publish('MemberExited', { memberId, exitReason }, actorId);

  await logAuditEvent({
    actorId,
    action: 'MEMBER_EXITED',
    entityType: 'NetworkMember',
    entityId: memberId,
    metadata: { memberCode: member.memberCode, exitReason },
  });

  return member;
}

/**
 * Archive a network member.
 */
export async function archiveMember(memberId: string, actorId: string) {
  const now = new Date();

  const member = await db.networkMember.update({
    where: { id: memberId },
    data: {
      status: 'ARCHIVED',
      archivedAt: now,
      updatedBy: actorId,
    },
    include: { user: true },
  });

  await eventBus.publish('MemberArchived', { memberId }, actorId);

  await logAuditEvent({
    actorId,
    action: 'MEMBER_ARCHIVED',
    entityType: 'NetworkMember',
    entityId: memberId,
    metadata: { memberCode: member.memberCode },
  });

  return member;
}

/**
 * Restore an archived or exited network member back to ACTIVE.
 */
export async function restoreMember(memberId: string, actorId: string) {
  const member = await db.networkMember.update({
    where: { id: memberId },
    data: {
      status: 'ACTIVE',
      archivedAt: null,
      exitedAt: null,
      exitReason: null,
      updatedBy: actorId,
    },
    include: { user: true },
  });

  await eventBus.publish('MemberRestored', { memberId }, actorId);

  await logAuditEvent({
    actorId,
    action: 'MEMBER_RESTORED',
    entityType: 'NetworkMember',
    entityId: memberId,
    metadata: { memberCode: member.memberCode },
  });

  return member;
}

/**
 * Create a new network member and assign existing sponsor.
 */
export async function createNetworkMember(payload: CreateMemberPayload, actorId: string) {
  const sponsor = await db.networkMember.findUnique({
    where: { id: payload.sponsorId },
  });

  if (!sponsor) {
    throw new Error('Selected sponsor does not exist.');
  }

  const count = await db.networkMember.count();
  const memberCode = `NM-${10001 + count}`;

  const defaultPassword = 'MemberPassword123!';
  const bcrypt = await import('bcryptjs');
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  const newUser = await db.user.create({
    data: {
      email: payload.email,
      passwordHash: hashedPassword,
      name: `${payload.firstName} ${payload.lastName}`,
      status: 'ACTIVE',
      profile: {
        create: {
          firstName: payload.firstName,
          lastName: payload.lastName,
          displayName: `${payload.firstName} ${payload.lastName}`,
          phone: payload.phone,
        },
      },
      networkMember: {
        create: {
          memberCode,
          status: payload.status || 'ACTIVE',
          joinedAt: payload.joinedAt ? new Date(payload.joinedAt) : new Date(),
          activatedAt: new Date(),
          createdBy: actorId,
        },
      },
    },
    include: { networkMember: true, profile: true },
  });

  const newMember = newUser.networkMember!;

  await db.organizationRelationship.create({
    data: {
      memberId: newMember.id,
      sponsorId: sponsor.id,
      relationshipType: 'SPONSOR',
      effectiveFrom: new Date(),
      reason: 'INITIAL_JOIN',
      createdBy: actorId,
    },
  });

  await eventBus.publish('MemberCreated', { memberId: newMember.id, memberCode }, actorId);

  await logAuditEvent({
    actorId,
    action: 'MEMBER_CREATED',
    entityType: 'NetworkMember',
    entityId: newMember.id,
    metadata: { memberCode, email: payload.email, sponsorId: sponsor.id },
  });

  return newMember;
}

/**
 * Search network members by name, email, phone, or memberCode.
 */
export async function searchMembers(query: string, limit = 20): Promise<NetworkMemberSummary[]> {
  const whereCondition = query.trim()
    ? {
        OR: [
          { memberCode: { contains: query, mode: 'insensitive' as const } },
          { user: { email: { contains: query, mode: 'insensitive' as const } } },
          { user: { name: { contains: query, mode: 'insensitive' as const } } },
          { user: { profile: { firstName: { contains: query, mode: 'insensitive' as const } } } },
          { user: { profile: { lastName: { contains: query, mode: 'insensitive' as const } } } },
          { user: { profile: { phone: { contains: query, mode: 'insensitive' as const } } } },
        ],
      }
    : {};

  const members = await db.networkMember.findMany({
    where: whereCondition,
    take: limit,
    include: {
      user: {
        include: {
          profile: true,
          userRoles: { include: { role: true } },
        },
      },
    },
  });

  const results: NetworkMemberSummary[] = [];

  for (const m of members) {
    const sponsor = await getCurrentSponsor(m.id);
    const directCount = await db.organizationRelationship.count({
      where: { sponsorId: m.id, effectiveTo: null, relationshipType: 'SPONSOR' },
    });
    const totalCount = await getTotalDownlineCount(m.id);

    results.push({
      id: m.id,
      memberCode: m.memberCode,
      userId: m.userId,
      name: m.user.profile?.displayName || m.user.name || m.user.email,
      email: m.user.email,
      avatarUrl: m.user.profile?.avatarUrl,
      phone: m.user.profile?.phone,
      status: m.status as any,
      joinedAt: m.joinedAt,
      activatedAt: m.activatedAt,
      exitedAt: m.exitedAt,
      exitReason: m.exitReason,
      archivedAt: m.archivedAt,
      roleName: m.user.userRoles[0]?.role?.name || 'MEMBER',
      directDownlineCount: directCount,
      totalDownlineCount: totalCount,
      sponsor,
    });
  }

  return results;
}

/**
 * Fetch complete relationship history for a member.
 */
export async function getMemberOrgHistory(memberId: string): Promise<OrgHistoryItem[]> {
  const rels = await db.organizationRelationship.findMany({
    where: { memberId, relationshipType: 'SPONSOR' },
    orderBy: { effectiveFrom: 'desc' },
    include: {
      sponsor: {
        include: {
          user: { include: { profile: true } },
        },
      },
    },
  });

  return rels.map((r) => ({
    id: r.id,
    effectiveFrom: r.effectiveFrom,
    effectiveTo: r.effectiveTo,
    reason: r.reason,
    createdBy: r.createdBy,
    sponsor: r.sponsor
      ? {
          id: r.sponsor.id,
          memberCode: r.sponsor.memberCode,
          name: r.sponsor.user.profile?.displayName || r.sponsor.user.name || r.sponsor.user.email,
          email: r.sponsor.user.email,
        }
      : null,
  }));
}

/**
 * Get organization-wide summary metrics for dashboard integration.
 */
export async function getOrganizationMetrics(memberId?: string): Promise<OrgMetricsSummary> {
  const totalMembers = await db.networkMember.count();
  const activeMembers = await db.networkMember.count({ where: { status: 'ACTIVE' } });
  const inactiveMembers = await db.networkMember.count({ where: { status: 'INACTIVE' } });
  const exitedMembers = await db.networkMember.count({ where: { status: 'EXITED' } });

  let directDownlineCount = 0;
  let totalOrganizationCount = 0;

  if (memberId) {
    directDownlineCount = await db.organizationRelationship.count({
      where: { sponsorId: memberId, effectiveTo: null, relationshipType: 'SPONSOR' },
    });
    totalOrganizationCount = await getTotalDownlineCount(memberId);
  }

  return {
    totalMembers,
    activeMembers,
    inactiveMembers,
    exitedMembers,
    directDownlineCount,
    totalOrganizationCount,
  };
}

import { db } from '@/lib/db';
import { eventBus } from '@/lib/events';
import { PostType, PostVisibility } from './types';
import { getDownlineMemberIds } from '@/modules/org/service';
import { hasPermission } from '@/lib/rbac';

export interface CreatePostInput {
  authorId: string;
  content: string;
  postType?: PostType;
  visibility?: PostVisibility;
  targetTeamScopeId?: string;
  evidenceId?: string;
  isPinned?: boolean;
}

export async function createCommunityPost(input: CreatePostInput) {
  if (!input.content || !input.content.trim()) {
    throw new Error('Post content cannot be empty.');
  }

  const post = await db.communityPost.create({
    data: {
      authorId: input.authorId,
      content: input.content.trim(),
      postType: input.postType || 'GENERAL',
      visibility: input.visibility || 'PUBLIC_COMMUNITY',
      targetTeamScopeId: input.targetTeamScopeId || null,
      evidenceId: input.evidenceId || null,
      isPinned: input.isPinned || false,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          profile: { select: { displayName: true, avatarUrl: true } },
        },
      },
      evidence: true,
      comments: { where: { deletedAt: null } },
      reactions: true,
    },
  });

  await db.auditLog.create({
    data: {
      actorId: input.authorId,
      action: 'POST_CREATED',
      entityType: 'CommunityPost',
      entityId: post.id,
      metadata: JSON.stringify({
        postType: post.postType,
        visibility: post.visibility,
        targetTeamScopeId: post.targetTeamScopeId,
      }),
    },
  });

  await eventBus.publish('CommunityPostCreated', {
    postId: post.id,
    authorId: post.authorId,
    postType: post.postType,
    visibility: post.visibility,
  }, input.authorId);

  return post;
}

export async function getVisibleCommunityFeed(viewerUserId: string, limit = 20, offset = 0) {
  const viewer = await db.user.findUnique({
    where: { id: viewerUserId },
    include: {
      networkMember: true,
    },
  });

  if (!viewer) {
    throw new Error('Viewer user not found.');
  }

  const isLeaderOrAdmin = (await hasPermission(viewerUserId, 'community:moderate')) || (await hasPermission(viewerUserId, 'community:analytics:read'));
  const viewerMemberId = viewer.networkMember?.id;

  // Build visibility conditions
  const visibilityConditions: any[] = [
    { visibility: 'PUBLIC_COMMUNITY' },
    { authorId: viewerUserId },
  ];

  if (isLeaderOrAdmin) {
    visibilityConditions.push({ visibility: 'LEADERS_ONLY' });
  }

  if (viewerMemberId) {
    // Member can see team posts where targetTeamScopeId is viewerMemberId OR viewer is in targetTeamScopeId's downline tree
    const teamPosts = await db.communityPost.findMany({
      where: { visibility: 'TEAM', deletedAt: null },
      select: { id: true, targetTeamScopeId: true },
    });

    const eligiblePostIds: string[] = [];
    for (const p of teamPosts) {
      if (!p.targetTeamScopeId) continue;
      if (p.targetTeamScopeId === viewerMemberId) {
        eligiblePostIds.push(p.id);
      } else {
        const downlineIds = await getDownlineMemberIds(p.targetTeamScopeId);
        if (downlineIds.includes(viewerMemberId)) {
          eligiblePostIds.push(p.id);
        }
      }
    }

    if (eligiblePostIds.length > 0) {
      visibilityConditions.push({ id: { in: eligiblePostIds } });
    }
  }

  const posts = await db.communityPost.findMany({
    where: {
      deletedAt: null,
      OR: visibilityConditions,
    },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    take: limit,
    skip: offset,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          profile: { select: { displayName: true, avatarUrl: true } },
        },
      },
      evidence: true,
      comments: {
        where: { deletedAt: null, parentId: null },
        orderBy: { createdAt: 'asc' },
        include: {
          author: { select: { id: true, name: true, profile: { select: { displayName: true, avatarUrl: true } } } },
          reactions: true,
          replies: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'asc' },
            include: {
              author: { select: { id: true, name: true, profile: { select: { displayName: true, avatarUrl: true } } } },
              reactions: true,
            },
          },
        },
      },
      reactions: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  return posts;
}

export async function archiveCommunityPost(postId: string, actorUserId: string) {
  const post = await db.communityPost.findUnique({ where: { id: postId } });
  if (!post) throw new Error('Post not found.');

  const updated = await db.communityPost.update({
    where: { id: postId },
    data: { archivedAt: new Date(), deletedAt: new Date() },
  });

  await db.auditLog.create({
    data: {
      actorId: actorUserId,
      action: 'POST_ARCHIVED',
      entityType: 'CommunityPost',
      entityId: postId,
    },
  });

  return updated;
}

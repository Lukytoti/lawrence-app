import { db } from '@/lib/db';
import { eventBus } from '@/lib/events';

export interface CreateCommentInput {
  postId: string;
  authorId: string;
  content: string;
  parentId?: string;
}

export async function createCommunityComment(input: CreateCommentInput) {
  if (!input.content || !input.content.trim()) {
    throw new Error('Comment content cannot be empty.');
  }

  const post = await db.communityPost.findUnique({ where: { id: input.postId } });
  if (!post || post.deletedAt) {
    throw new Error('Community post not found or deleted.');
  }

  if (input.parentId) {
    const parent = await db.communityComment.findUnique({ where: { id: input.parentId } });
    if (!parent || parent.deletedAt) {
      throw new Error('Parent comment not found or deleted.');
    }
  }

  const comment = await db.communityComment.create({
    data: {
      postId: input.postId,
      authorId: input.authorId,
      content: input.content.trim(),
      parentId: input.parentId || null,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          profile: { select: { displayName: true, avatarUrl: true } },
        },
      },
      reactions: true,
    },
  });

  await db.auditLog.create({
    data: {
      actorId: input.authorId,
      action: 'COMMENT_CREATED',
      entityType: 'CommunityComment',
      entityId: comment.id,
      metadata: JSON.stringify({ postId: input.postId, parentId: input.parentId }),
    },
  });

  await eventBus.publish('CommunityPostCommented', {
    commentId: comment.id,
    postId: input.postId,
    authorId: input.authorId,
    parentId: input.parentId,
  }, input.authorId);

  return comment;
}

export async function deleteCommunityComment(commentId: string, actorUserId: string) {
  const comment = await db.communityComment.findUnique({ where: { id: commentId } });
  if (!comment) throw new Error('Comment not found.');

  const updated = await db.communityComment.update({
    where: { id: commentId },
    data: { deletedAt: new Date() },
  });

  await db.auditLog.create({
    data: {
      actorId: actorUserId,
      action: 'COMMENT_DELETED',
      entityType: 'CommunityComment',
      entityId: commentId,
    },
  });

  return updated;
}

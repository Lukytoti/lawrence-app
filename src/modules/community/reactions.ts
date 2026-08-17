import { db } from '@/lib/db';
import { eventBus } from '@/lib/events';
import { ReactionTargetType, ReactionType } from './types';

export interface ToggleReactionInput {
  targetType: ReactionTargetType;
  targetId: string;
  userId: string;
  reactionType?: ReactionType;
  postId?: string;
  commentId?: string;
  messageId?: string;
}

export async function toggleCommunityReaction(input: ToggleReactionInput) {
  // Enforce strict application invariant rules for polymorphic FK alignment
  if (input.targetType === 'POST') {
    if (!input.postId || input.postId !== input.targetId || input.commentId || input.messageId) {
      throw new Error('Invalid polymorphic reaction target or foreign key alignment: POST target requires postId matching targetId, with commentId and messageId null.');
    }
  } else if (input.targetType === 'COMMENT') {
    if (!input.commentId || input.commentId !== input.targetId || input.postId || input.messageId) {
      throw new Error('Invalid polymorphic reaction target or foreign key alignment: COMMENT target requires commentId matching targetId, with postId and messageId null.');
    }
  } else if (input.targetType === 'MESSAGE') {
    if (!input.messageId || input.messageId !== input.targetId || input.postId || input.commentId) {
      throw new Error('Invalid polymorphic reaction target or foreign key alignment: MESSAGE target requires messageId matching targetId, with postId and commentId null.');
    }
  } else {
    throw new Error('Invalid polymorphic reaction target type.');
  }

  // Check if reaction already exists
  const existing = await db.communityReaction.findUnique({
    where: {
      targetType_targetId_userId: {
        targetType: input.targetType,
        targetId: input.targetId,
        userId: input.userId,
      },
    },
  });

  if (existing) {
    if (existing.reactionType === (input.reactionType || 'LIKE')) {
      // Remove reaction (toggle off)
      await db.communityReaction.delete({ where: { id: existing.id } });
      return { action: 'REMOVED', reaction: null };
    } else {
      // Update reaction type
      const updated = await db.communityReaction.update({
        where: { id: existing.id },
        data: { reactionType: input.reactionType || 'LIKE' },
      });
      return { action: 'UPDATED', reaction: updated };
    }
  }

  // Create new reaction
  const reaction = await db.communityReaction.create({
    data: {
      targetType: input.targetType,
      targetId: input.targetId,
      userId: input.userId,
      reactionType: input.reactionType || 'LIKE',
      postId: input.targetType === 'POST' ? input.postId : null,
      commentId: input.targetType === 'COMMENT' ? input.commentId : null,
      messageId: input.targetType === 'MESSAGE' ? input.messageId : null,
    },
  });

  await eventBus.publish('CommunityPostReacted', {
    reactionId: reaction.id,
    targetType: input.targetType,
    targetId: input.targetId,
    userId: input.userId,
    reactionType: reaction.reactionType,
  }, input.userId);

  return { action: 'ADDED', reaction };
}

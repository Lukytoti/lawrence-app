'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { createCommunityPost, archiveCommunityPost, getVisibleCommunityFeed } from './posts';
import { createCommunityComment, deleteCommunityComment } from './comments';
import { toggleCommunityReaction } from './reactions';
import { processMentions } from './mentions';
import {
  getOrCreateDirectConversation,
  sendDirectMessage,
  markConversationAsRead,
  getUserConversations,
  getConversationMessages,
} from './messaging';
import {
  createTrainingModule,
  assignTrainingModule,
  updateTrainingProgress,
  reviewTrainingProgress,
} from './training';
import { calculateMemberEngagementScore } from './engagement';
import { getActiveLeadershipAttentionAlerts } from './attention';
import { revalidatePath } from 'next/cache';
import { PostType, PostVisibility, ReactionTargetType, ReactionType } from './types';

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) {
    throw new Error('Unauthorized: Authentication session required.');
  }
  return session?.user as any;
}

export async function createPostAction(data: {
  content: string;
  postType?: PostType;
  visibility?: PostVisibility;
  targetTeamScopeId?: string;
  evidenceId?: string;
  isPinned?: boolean;
}) {
  const user = await getAuthenticatedUser();
  const allowed = await hasPermission(user.id, 'community:post');
  if (!allowed) throw new Error('Forbidden: Lacks community:post permission.');

  const post = await createCommunityPost({
    authorId: user.id,
    ...data,
  });

  // Process @mentions in post content
  await processMentions({
    targetType: 'POST',
    targetId: post.id,
    content: data.content,
    createdById: user.id,
  });

  revalidatePath('/community');
  return { success: true, post };
}

export async function createCommentAction(data: {
  postId: string;
  content: string;
  parentId?: string;
}) {
  const user = await getAuthenticatedUser();
  const allowed = await hasPermission(user.id, 'community:comment');
  if (!allowed) throw new Error('Forbidden: Lacks community:comment permission.');

  const comment = await createCommunityComment({
    authorId: user.id,
    ...data,
  });

  await processMentions({
    targetType: 'COMMENT',
    targetId: comment.id,
    content: data.content,
    createdById: user.id,
  });

  revalidatePath('/community');
  revalidatePath(`/community/post/${data.postId}`);
  return { success: true, comment };
}

export async function toggleReactionAction(data: {
  targetType: ReactionTargetType;
  targetId: string;
  reactionType?: ReactionType;
  postId?: string;
  commentId?: string;
  messageId?: string;
}) {
  const user = await getAuthenticatedUser();
  const allowed = await hasPermission(user.id, 'community:read');
  if (!allowed) throw new Error('Forbidden: Lacks community:read permission.');

  const result = await toggleCommunityReaction({
    userId: user.id,
    ...data,
  });

  revalidatePath('/community');
  return { success: true, ...result };
}

export async function startDirectMessageAction(recipientUserId: string) {
  const user = await getAuthenticatedUser();
  const allowed = await hasPermission(user.id, 'community:messages');
  if (!allowed) throw new Error('Forbidden: Lacks community:messages permission.');

  const conversation = await getOrCreateDirectConversation({
    initiatorUserId: user.id,
    recipientUserId,
  });

  revalidatePath('/messages');
  return { success: true, conversationId: conversation.id };
}

export async function sendMessageAction(conversationId: string, content: string, evidenceId?: string) {
  const user = await getAuthenticatedUser();
  const allowed = await hasPermission(user.id, 'community:messages');
  if (!allowed) throw new Error('Forbidden: Lacks community:messages permission.');

  const message = await sendDirectMessage({
    conversationId,
    senderUserId: user.id,
    content,
    evidenceId,
  });

  revalidatePath('/messages');
  revalidatePath(`/messages/${conversationId}`);
  return { success: true, message };
}

export async function markReadAction(conversationId: string) {
  const user = await getAuthenticatedUser();
  const allowed = await hasPermission(user.id, 'community:messages');
  if (!allowed) throw new Error('Forbidden: Lacks community:messages permission.');

  const res = await markConversationAsRead(conversationId, user.id);
  revalidatePath('/messages');
  return { success: true, ...res };
}

export async function createTrainingAction(data: {
  title: string;
  description: string;
  category?: any;
  content: string;
  resourceUrl?: string;
  durationMinutes?: number;
}) {
  const user = await getAuthenticatedUser();
  const allowed = await hasPermission(user.id, 'community:training:create');
  if (!allowed) throw new Error('Forbidden: Lacks community:training:create permission.');

  const module = await createTrainingModule({
    createdById: user.id,
    ...data,
  });

  revalidatePath('/community/training');
  return { success: true, module };
}

export async function assignTrainingAction(data: {
  trainingId: string;
  assignedScopeType: 'INDIVIDUAL' | 'TEAM' | 'ORG' | 'ROLE' | 'RANK';
  assignedScopeValue: string;
  dueAt?: string;
  priority?: any;
}) {
  const user = await getAuthenticatedUser();
  const allowed = await hasPermission(user.id, 'community:training:assign');
  if (!allowed) throw new Error('Forbidden: Lacks community:training:assign permission.');

  const assignments = await assignTrainingModule({
    assignedById: user.id,
    trainingId: data.trainingId,
    assignedScopeType: data.assignedScopeType,
    assignedScopeValue: data.assignedScopeValue,
    dueAt: data.dueAt ? new Date(data.dueAt) : undefined,
    priority: data.priority,
  });

  revalidatePath('/community/training');
  return { success: true, count: assignments.length };
}

export async function updateProgressAction(assignmentId: string, progressPercent: number, evidenceId?: string) {
  const user = await getAuthenticatedUser();
  const allowed = await hasPermission(user.id, 'community:training:read');
  if (!allowed) throw new Error('Forbidden: Lacks community:training:read permission.');

  const res = await updateTrainingProgress({
    assignmentId,
    actorUserId: user.id,
    progressPercent,
    evidenceId,
  });

  revalidatePath('/community/training');
  return { success: true, ...res };
}

export async function reviewProgressAction(assignmentId: string, status: 'COMPLETED' | 'REVISION_REQUIRED', notes?: string) {
  const user = await getAuthenticatedUser();
  const allowed = await hasPermission(user.id, 'community:training:review');
  if (!allowed) throw new Error('Forbidden: Lacks community:training:review permission.');

  const res = await reviewTrainingProgress(assignmentId, user.id, status, notes);
  revalidatePath('/community/training');
  return { success: true, ...res };
}

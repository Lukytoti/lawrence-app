import { db } from '@/lib/db';
import { eventBus } from '@/lib/events';
import { MentionTargetType } from './types';

export interface ProcessMentionsInput {
  targetType: MentionTargetType;
  targetId: string;
  content: string;
  createdById: string;
}

export async function processMentions(input: ProcessMentionsInput) {
  if (!input.content) return [];

  // Match pattern @[Name or Email] or @username
  const mentionRegex = /@([a-zA-Z0-9._-]+)/g;
  const matches = Array.from(input.content.matchAll(mentionRegex));
  if (matches.length === 0) return [];

  const createdMentions = [];

  for (const match of matches) {
    const handle = match[1];
    // Find matching user by email or name/profile
    const user = await db.user.findFirst({
      where: {
        OR: [
          { email: { contains: handle, mode: 'insensitive' } },
          { name: { contains: handle, mode: 'insensitive' } },
          { profile: { displayName: { contains: handle, mode: 'insensitive' } } },
          { profile: { firstName: { contains: handle, mode: 'insensitive' } } },
        ],
      },
    });

    if (user && user.id !== input.createdById) {
      const mention = await db.communityMention.create({
        data: {
          targetType: input.targetType,
          targetId: input.targetId,
          mentionedUserId: user.id,
          createdById: input.createdById,
        },
      });

      // Dispatch notification
      await db.notification.create({
        data: {
          userId: user.id,
          title: 'You were mentioned in a post',
          message: `Someone mentioned you in a community ${input.targetType.toLowerCase()}.`,
          type: 'INFO',
          link: input.targetType === 'POST' ? `/community/post/${input.targetId}` : `/community`,
        },
      });

      await eventBus.publish('MemberMentioned', {
        mentionId: mention.id,
        targetType: input.targetType,
        targetId: input.targetId,
        mentionedUserId: user.id,
        createdById: input.createdById,
      }, input.createdById);

      createdMentions.push(mention);
    }
  }

  return createdMentions;
}

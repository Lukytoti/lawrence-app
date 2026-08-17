import { db } from '@/lib/db';
import { eventBus } from '@/lib/events';

export interface GetOrCreateConversationInput {
  initiatorUserId: string;
  recipientUserId: string;
}

export async function getOrCreateDirectConversation(input: GetOrCreateConversationInput) {
  if (input.initiatorUserId === input.recipientUserId) {
    throw new Error('Cannot start a direct conversation with yourself.');
  }

  // Find existing DIRECT conversation containing both participants
  const existing = await db.conversation.findFirst({
    where: {
      type: 'DIRECT',
      AND: [
        { participants: { some: { userId: input.initiatorUserId } } },
        { participants: { some: { userId: input.recipientUserId } } },
      ],
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              profile: { select: { displayName: true, avatarUrl: true } },
            },
          },
        },
      },
      messages: {
        take: 1,
        orderBy: { sentAt: 'desc' },
        include: { readReceipts: true },
      },
    },
  });

  if (existing) {
    return existing;
  }

  // Create new conversation
  const conversation = await db.conversation.create({
    data: {
      type: 'DIRECT',
      participants: {
        create: [
          { userId: input.initiatorUserId },
          { userId: input.recipientUserId },
        ],
      },
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              profile: { select: { displayName: true, avatarUrl: true } },
            },
          },
        },
      },
      messages: true,
    },
  });

  await db.auditLog.create({
    data: {
      actorId: input.initiatorUserId,
      action: 'CONVERSATION_CREATED',
      entityType: 'Conversation',
      entityId: conversation.id,
      metadata: JSON.stringify({ type: 'DIRECT', recipientUserId: input.recipientUserId }),
    },
  });

  return conversation;
}

export interface SendMessageInput {
  conversationId: string;
  senderUserId: string;
  content: string;
  evidenceId?: string;
}

export async function sendDirectMessage(input: SendMessageInput) {
  if (!input.content || !input.content.trim()) {
    throw new Error('Message content cannot be empty.');
  }

  // Verify sender is an active participant in the conversation
  const participant = await db.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId: input.conversationId,
        userId: input.senderUserId,
      },
    },
  });

  if (!participant) {
    throw new Error('Unauthorized: Sender is not a participant in this conversation.');
  }

  const message = await db.directMessage.create({
    data: {
      conversationId: input.conversationId,
      senderId: input.senderUserId,
      content: input.content.trim(),
      evidenceId: input.evidenceId || null,
      deliveredAt: new Date(),
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
          profile: { select: { displayName: true, avatarUrl: true } },
        },
      },
      evidence: true,
      readReceipts: true,
    },
  });

  // Automatically record read receipt for sender
  await db.messageReadReceipt.upsert({
    where: {
      messageId_readerId: {
        messageId: message.id,
        readerId: input.senderUserId,
      },
    },
    update: { readAt: new Date() },
    create: {
      messageId: message.id,
      readerId: input.senderUserId,
      readAt: new Date(),
    },
  });

  // Update conversation updatedAt
  await db.conversation.update({
    where: { id: input.conversationId },
    data: { updatedAt: new Date() },
  });

  // Audit log metadata explicitly excludes message content for privacy safety
  await db.auditLog.create({
    data: {
      actorId: input.senderUserId,
      action: 'MESSAGE_SENT',
      entityType: 'DirectMessage',
      entityId: message.id,
      metadata: JSON.stringify({ conversationId: input.conversationId }),
    },
  });

  await eventBus.publish('PrivateMessageSent', {
    messageId: message.id,
    conversationId: input.conversationId,
    senderId: input.senderUserId,
  }, input.senderUserId);

  return message;
}

export async function markConversationAsRead(conversationId: string, readerUserId: string) {
  const participant = await db.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId: readerUserId,
      },
    },
  });

  if (!participant) {
    throw new Error('Unauthorized: User is not a participant in this conversation.');
  }

  // Find unread messages in conversation for readerUserId
  const unreadMessages = await db.directMessage.findMany({
    where: {
      conversationId,
      senderId: { not: readerUserId },
      readReceipts: { none: { readerId: readerUserId } },
    },
    select: { id: true },
  });

  for (const m of unreadMessages) {
    await db.messageReadReceipt.upsert({
      where: {
        messageId_readerId: {
          messageId: m.id,
          readerId: readerUserId,
        },
      },
      update: { readAt: new Date() },
      create: {
        messageId: m.id,
        readerId: readerUserId,
        readAt: new Date(),
      },
    });
  }

  await db.conversationParticipant.update({
    where: { id: participant.id },
    data: { lastReadAt: new Date() },
  });

  await eventBus.publish('PrivateMessageRead', {
    conversationId,
    readerUserId,
    readCount: unreadMessages.length,
  }, readerUserId);

  return { readCount: unreadMessages.length };
}

export async function getUserConversations(userId: string) {
  const participants = await db.conversationParticipant.findMany({
    where: { userId, isArchived: false },
    include: {
      conversation: {
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  profile: { select: { displayName: true, avatarUrl: true } },
                },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: { sentAt: 'desc' },
            include: { readReceipts: true },
          },
        },
      },
    },
    orderBy: { conversation: { updatedAt: 'desc' } },
  });

  return participants.map((p) => {
    const conv = p.conversation;
    const lastMsg = conv.messages[0];
    const isUnread = lastMsg ? !lastMsg.readReceipts.some((r) => r.readerId === userId) : false;
    return {
      conversationId: conv.id,
      type: conv.type,
      title: conv.title,
      updatedAt: conv.updatedAt,
      participants: conv.participants,
      lastMessage: lastMsg || null,
      isUnread,
    };
  });
}

export async function getConversationMessages(conversationId: string, viewerUserId: string, limit = 50) {
  const participant = await db.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId: viewerUserId,
      },
    },
  });

  if (!participant) {
    throw new Error('Unauthorized: Viewer is not a participant in this conversation.');
  }

  const messages = await db.directMessage.findMany({
    where: { conversationId, deletedAt: null },
    orderBy: { sentAt: 'asc' },
    take: limit,
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
          profile: { select: { displayName: true, avatarUrl: true } },
        },
      },
      evidence: true,
      readReceipts: {
        include: { reader: { select: { id: true, name: true } } },
      },
      reactions: true,
    },
  });

  return messages;
}

export async function getUnreadMessageCount(userId: string) {
  const count = await db.directMessage.count({
    where: {
      conversation: { participants: { some: { userId } } },
      senderId: { not: userId },
      deletedAt: null,
      readReceipts: { none: { readerId: userId } },
    },
  });

  return count;
}

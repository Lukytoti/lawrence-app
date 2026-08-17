import { db } from './db';

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  link?: string;
}

export async function createNotification(input: CreateNotificationInput) {
  try {
    const notification = await db.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        message: input.message,
        type: input.type || 'INFO',
        link: input.link,
      },
    });
    return notification;
  } catch (error) {
    console.error('[NotificationService] Failed to create notification:', error);
    return null;
  }
}

export async function getUserNotifications(userId: string, limit = 20) {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function getUnreadCount(userId: string): Promise<number> {
  return db.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}

export async function markAsRead(notificationId: string, userId: string) {
  return db.notification.updateMany({
    where: {
      id: notificationId,
      userId,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

export async function markAllAsRead(userId: string) {
  return db.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

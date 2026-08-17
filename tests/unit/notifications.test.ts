import { describe, it, expect, vi } from 'vitest';
import { createNotification, getUnreadCount, markAsRead } from '@/lib/notifications';
import { db } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  db: {
    notification: {
      create: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

describe('Notification Service', () => {
  it('should create notification with default INFO type', async () => {
    (db.notification.create as any).mockResolvedValue({ id: 'notif-1', title: 'Test' });

    const res = await createNotification({
      userId: 'user-1',
      title: 'Welcome',
      message: 'System test notification',
    });

    expect(db.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        title: 'Welcome',
        message: 'System test notification',
        type: 'INFO',
        link: undefined,
      },
    });

    expect(res).toBeDefined();
  });

  it('should calculate unread notification count', async () => {
    (db.notification.count as any).mockResolvedValue(5);

    const count = await getUnreadCount('user-1');
    expect(count).toBe(5);
    expect(db.notification.count).toHaveBeenCalledWith({
      where: { userId: 'user-1', isRead: false },
    });
  });
});

import { db } from '@/lib/db';
import { assertNotificationPermission } from './permissions';

export async function getExecutiveNotificationDashboard(actorUserId: string) {
  await assertNotificationPermission(actorUserId, 'notifications:read_own');

  const [
    totalTemplates,
    totalMessages,
    totalDeliveries,
    totalCampaigns,
    deliveredCount,
    failedCount,
    suppressedCount,
    recentMessages,
  ] = await Promise.all([
    db.notificationTemplate.count(),
    db.notificationMessage.count(),
    db.notificationDelivery.count(),
    db.notificationCampaign.count(),
    db.notificationMessage.count({ where: { status: 'DELIVERED' } }),
    db.notificationMessage.count({ where: { status: 'FAILED' } }),
    db.notificationMessage.count({ where: { status: 'CANCELLED' } }),
    db.notificationMessage.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { template: true, deliveries: true },
    }),
  ]);

  const deliverySuccessRate =
    totalMessages > 0 ? Number(((deliveredCount / totalMessages) * 100).toFixed(1)) : 100;

  return {
    metrics: {
      totalTemplates,
      totalMessages,
      totalDeliveries,
      totalCampaigns,
      deliveredCount,
      failedCount,
      suppressedCount,
      deliverySuccessRate,
    },
    recentMessages,
  };
}

export async function getNotificationTemplates(actorUserId: string) {
  await assertNotificationPermission(actorUserId, 'notifications:read_own');
  return db.notificationTemplate.findMany({
    orderBy: { createdAt: 'desc' },
    include: { createdBy: { select: { id: true, email: true } } },
  });
}

export async function getNotificationMessages(actorUserId: string) {
  await assertNotificationPermission(actorUserId, 'notifications:read_own');
  return db.notificationMessage.findMany({
    take: 50,
    orderBy: { createdAt: 'desc' },
    include: { template: true, recipient: { select: { id: true, email: true } }, deliveries: true },
  });
}

export async function getNotificationDeliveries(actorUserId: string) {
  await assertNotificationPermission(actorUserId, 'notifications:read_own');
  return db.notificationDelivery.findMany({
    take: 50,
    orderBy: { createdAt: 'desc' },
    include: { message: true, logs: true },
  });
}

export async function getNotificationCampaigns(actorUserId: string) {
  await assertNotificationPermission(actorUserId, 'notifications:read_own');
  return db.notificationCampaign.findMany({
    orderBy: { createdAt: 'desc' },
    include: { template: true, createdBy: { select: { id: true, email: true } } },
  });
}

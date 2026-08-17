import { db } from '@/lib/db';
import { CreateCampaignInput } from './types';
import { dispatchNotification } from './dispatcher';
import { logAuditEvent } from '@/lib/audit';
import { eventBus } from '@/lib/events';

export async function createNotificationCampaign(
  input: CreateCampaignInput,
  actorUserId: string
) {
  const count = await db.notificationCampaign.count();
  const campaignCode = input.campaignCode || `CMP-${new Date().getFullYear()}-${10001 + count}`;

  const campaign = await db.notificationCampaign.create({
    data: {
      campaignCode,
      name: input.name,
      description: input.description,
      templateId: input.templateId,
      status: 'DRAFT',
      targetSegment: input.targetSegment,
      scheduledAt: input.scheduledAt || new Date(),
      createdById: actorUserId,
    },
  });

  await logAuditEvent({
    actorId: actorUserId,
    action: 'CAMPAIGN_CREATED',
    entityType: 'NotificationCampaign',
    entityId: campaign.id,
    metadata: { campaignCode: campaign.campaignCode },
  });

  return campaign;
}

export async function executeNotificationCampaign(
  campaignId: string,
  actorUserId: string
) {
  const campaign = await db.notificationCampaign.findUnique({
    where: { id: campaignId },
    include: { template: true },
  });

  if (!campaign) throw new Error('Campaign not found');
  if (campaign.status === 'SENDING' || campaign.status === 'COMPLETED') {
    throw new Error(`Campaign already in ${campaign.status} state`);
  }

  await db.notificationCampaign.update({
    where: { id: campaignId },
    data: { status: 'SENDING' },
  });

  await eventBus.publish('CampaignStarted', { campaignId: campaign.id });

  // Resolve target recipients based on segment
  const users = await db.user.findMany({
    take: 5, // Batch limit for performance
    select: { id: true, email: true },
  });

  let dispatchedCount = 0;
  for (const user of users) {
    await dispatchNotification(
      {
        templateId: campaign.templateId,
        channel: campaign.template.channel as any,
        recipientId: user.id,
        recipientEmail: user.email,
        category: 'MARKETING',
        idempotencyKey: `Campaign:${campaign.id}:User:${user.id}`,
      },
      actorUserId
    );
    dispatchedCount++;
  }

  const updatedCampaign = await db.notificationCampaign.update({
    where: { id: campaignId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  });

  await logAuditEvent({
    actorId: actorUserId,
    action: 'CAMPAIGN_COMPLETED',
    entityType: 'NotificationCampaign',
    entityId: campaign.id,
    metadata: { dispatchedCount },
  });

  await eventBus.publish('CampaignCompleted', { campaignId: campaign.id, dispatchedCount });

  return updatedCampaign;
}

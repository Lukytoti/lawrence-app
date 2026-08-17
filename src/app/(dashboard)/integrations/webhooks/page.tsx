import React from 'react';
import WebhookListClient from '@/modules/integrations/components/WebhookListClient';
import { db } from '@/lib/db';

export const metadata = {
  title: 'Webhook Gateway | Lawrence Operating System',
  description: 'Inbound and outbound webhooks and signature verification.',
};

export default async function WebhooksPage() {
  const webhooks = await db.integrationWebhook.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return <WebhookListClient webhooks={webhooks} />;
}

import { db } from '@/lib/db';
import { CreateTemplateInput } from './types';
import { logAuditEvent } from '@/lib/audit';

export function substituteTemplateVariables(
  templateString: string,
  variables: Record<string, any> = {}
): string {
  return templateString.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    return variables[key] !== undefined && variables[key] !== null ? String(variables[key]) : '';
  });
}

export async function createNotificationTemplate(
  input: CreateTemplateInput,
  actorUserId: string
) {
  const count = await db.notificationTemplate.count();
  const templateCode = input.templateCode || `TMPL-${input.category || 'SYS'}-${10001 + count}`;

  const template = await db.notificationTemplate.create({
    data: {
      templateCode,
      name: input.name,
      channel: input.channel,
      subject: input.subject,
      bodyTemplate: input.bodyTemplate,
      variablesJson: JSON.stringify(input.variablesJson || []),
      category: input.category || 'SYSTEM',
      isActive: input.isActive ?? true,
      version: 1,
      createdById: actorUserId,
    },
  });

  await logAuditEvent({
    actorId: actorUserId,
    action: 'NOTIFICATION_TEMPLATE_CREATED',
    entityType: 'NotificationTemplate',
    entityId: template.id,
    metadata: { templateCode: template.templateCode, channel: template.channel },
  });

  return template;
}

export async function updateNotificationTemplate(
  templateId: string,
  updates: Partial<CreateTemplateInput>,
  actorUserId: string
) {
  const existing = await db.notificationTemplate.findUnique({ where: { id: templateId } });
  if (!existing) throw new Error('Notification template not found');

  const updated = await db.notificationTemplate.update({
    where: { id: templateId },
    data: {
      name: updates.name ?? existing.name,
      subject: updates.subject ?? existing.subject,
      bodyTemplate: updates.bodyTemplate ?? existing.bodyTemplate,
      variablesJson: updates.variablesJson ? JSON.stringify(updates.variablesJson) : existing.variablesJson,
      category: updates.category ?? existing.category,
      isActive: updates.isActive ?? existing.isActive,
      version: existing.version + 1,
    },
  });

  await logAuditEvent({
    actorId: actorUserId,
    action: 'NOTIFICATION_TEMPLATE_UPDATED',
    entityType: 'NotificationTemplate',
    entityId: updated.id,
    metadata: { version: updated.version },
  });

  return updated;
}

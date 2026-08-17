import { hasPermission } from '@/lib/rbac';

export async function hasNotificationPermission(userId: string, permCode: string): Promise<boolean> {
  return hasPermission(userId, permCode);
}

export async function assertNotificationPermission(userId: string, permCode: string): Promise<void> {
  const allowed = await hasNotificationPermission(userId, permCode);
  if (!allowed) {
    throw new Error(`Unauthorized: User lacks required permission '${permCode}'`);
  }
}

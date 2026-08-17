import { hasPermission } from '@/lib/rbac';
import { db } from '@/lib/db';

export async function hasAiPermission(
  userId: string,
  permissionCode: string
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { status: true },
  });

  if (!user || user.status !== 'ACTIVE') return false;
  return hasPermission(userId, permissionCode);
}

export async function assertAiPermission(
  userId: string,
  permissionCode: string
): Promise<void> {
  const allowed = await hasAiPermission(userId, permissionCode);
  if (!allowed) {
    throw new Error(`Unauthorized: User lacks required permission [${permissionCode}]`);
  }
}

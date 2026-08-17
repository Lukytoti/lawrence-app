import { hasPermission } from '@/lib/rbac';
import { db } from '@/lib/db';

export async function hasAutomationPermission(userId: string, permCode: string): Promise<boolean> {
  return hasPermission(userId, permCode);
}

export async function assertAutomationPermission(userId: string, permCode: string): Promise<void> {
  const allowed = await hasPermission(userId, permCode);
  if (!allowed) {
    throw new Error(`Unauthorized: User ${userId} lacks permission ${permCode}`);
  }
}

export async function canAccessAutomation(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { userRoles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
  });

  if (!user) return false;

  const isSuperAdmin = user.userRoles.some((ur) => ur.role.name === 'SUPER_ADMIN');
  if (isSuperAdmin) return true;

  const userPerms = user.userRoles.flatMap((ur) => ur.role.permissions.map((rp) => rp.permission.code));
  return userPerms.some((p) => p.startsWith('automation:'));
}

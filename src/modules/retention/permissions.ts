import { hasPermission } from '@/lib/rbac';
import { db } from '@/lib/db';

export async function hasRetentionPermission(userId: string, permCode: string): Promise<boolean> {
  return hasPermission(userId, permCode);
}

export async function assertRetentionPermission(userId: string, permCode: string): Promise<void> {
  const allowed = await hasPermission(userId, permCode);
  if (!allowed) {
    throw new Error(`Unauthorized: User ${userId} lacks permission ${permCode}`);
  }
}

/**
 * Validates whether user can access client retention records.
 * Super Admin or users with retention:read_all / retention:read_team can access.
 * Client portal access is restricted to client's own email.
 */
export async function canAccessClientRetention(userId: string, clientId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { userRoles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
  });

  if (!user) return false;

  const isSuperAdmin = user.userRoles.some((ur) => ur.role.name === 'SUPER_ADMIN');
  if (isSuperAdmin) return true;

  const userPerms = user.userRoles.flatMap((ur) => ur.role.permissions.map((rp) => rp.permission.code));
  if (userPerms.includes('retention:read_all') || userPerms.includes('retention:admin')) {
    return true;
  }

  const client = await db.digitalClient.findUnique({ where: { id: clientId } });
  if (!client) return false;

  // Check if client email matches user email for client portal access
  if (client.email === user.email) return true;

  if (userPerms.includes('retention:read_team') || userPerms.includes('retention:read_own')) {
    return true;
  }

  return false;
}

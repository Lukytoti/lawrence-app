import { hasPermission } from '@/lib/rbac';
import { db } from '@/lib/db';

export async function hasCommandCenterPermission(
  userId: string,
  permCode: string
): Promise<boolean> {
  return hasPermission(userId, permCode);
}

export async function assertCommandCenterPermission(
  userId: string,
  permCode: string
): Promise<void> {
  const allowed = await hasPermission(userId, permCode);
  if (!allowed) {
    throw new Error(`Unauthorized: User ${userId} lacks permission ${permCode}`);
  }
}

/**
 * Checks if user is Super Admin or possesses system admin permissions.
 */
export async function isSuperAdminUser(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user) return false;
  return user.userRoles.some((ur) => ur.role.name === 'SUPER_ADMIN');
}

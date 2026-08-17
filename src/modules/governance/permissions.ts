import { hasPermission } from '@/lib/rbac';
import { db } from '@/lib/db';

export const GOVERNANCE_PERMISSIONS = {
  READ_OWN: 'governance:read_own',
  READ_TEAM: 'governance:read_team',
  READ_ALL: 'governance:read_all',
  MANAGE_SECURITY: 'governance:manage_security',
  MANAGE_INCIDENTS: 'governance:manage_incidents',
  MANAGE_ACCESS_REVIEWS: 'governance:manage_access_reviews',
  MANAGE_COMPLIANCE: 'governance:manage_compliance',
  MANAGE_RISKS: 'governance:manage_risks',
  MANAGE_OBSERVABILITY: 'governance:manage_observability',
  ADMIN: 'governance:admin',
  EXPORT: 'governance:export',
  AUDIT: 'governance:audit',
};

export async function isSuperAdminUser(userId: string): Promise<boolean> {
  const userRoles = await db.userRole.findMany({
    where: { userId },
    include: { role: true },
  });
  return userRoles.some((ur) => ur.role.name === 'SUPER_ADMIN');
}

export async function hasGovernancePermission(
  userId: string,
  permissionCode: string
): Promise<boolean> {
  const isSuper = await isSuperAdminUser(userId);
  if (isSuper) return true;
  return hasPermission(userId, permissionCode);
}

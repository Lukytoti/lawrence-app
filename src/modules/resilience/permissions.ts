import { db } from '@/lib/db';

export const RESILIENCE_PERMISSIONS = {
  READ_OWN: 'resilience:read_own',
  READ_TEAM: 'resilience:read_team',
  READ_ALL: 'resilience:read_all',
  CREATE: 'resilience:create',
  UPDATE: 'resilience:update',
  MANAGE_BACKUPS: 'resilience:manage_backups',
  EXECUTE_BACKUP: 'resilience:execute_backup',
  VERIFY_BACKUP: 'resilience:verify_backup',
  MANAGE_RECOVERY: 'resilience:manage_recovery',
  EXECUTE_RECOVERY: 'resilience:execute_recovery',
  MANAGE_CONTINUITY: 'resilience:manage_continuity',
  MANAGE_DEPENDENCIES: 'resilience:manage_dependencies',
  MANAGE_DRILLS: 'resilience:manage_drills',
  MANAGE_INCIDENTS: 'resilience:manage_incidents',
  ADMIN: 'resilience:admin',
  EXPORT: 'resilience:export',
  AUDIT: 'resilience:audit',
} as const;

export type ResiliencePermissionCode = typeof RESILIENCE_PERMISSIONS[keyof typeof RESILIENCE_PERMISSIONS];

export async function hasResiliencePermission(userId: string, requiredPermission: ResiliencePermissionCode): Promise<boolean> {
  const userWithRoles = await db.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      },
    },
  });

  if (!userWithRoles) return false;

  for (const ur of userWithRoles.userRoles) {
    // SUPER_ADMIN has all permissions
    if (ur.role.name === 'SUPER_ADMIN') return true;

    for (const rp of ur.role.permissions) {
      if (rp.permission.code === requiredPermission || rp.permission.code === RESILIENCE_PERMISSIONS.ADMIN) {
        return true;
      }
    }
  }

  return false;
}

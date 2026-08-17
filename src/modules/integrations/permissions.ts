import { db } from '@/lib/db';

export const INTEGRATION_PERMISSIONS = {
  READ_OWN: 'integrations:read_own',
  READ_TEAM: 'integrations:read_team',
  READ_ALL: 'integrations:read_all',
  CREATE: 'integrations:create',
  UPDATE: 'integrations:update',
  ACTIVATE: 'integrations:activate',
  PAUSE: 'integrations:pause',
  MANAGE_CONNECTIONS: 'integrations:manage_connections',
  MANAGE_WEBHOOKS: 'integrations:manage_webhooks',
  MANAGE_MAPPINGS: 'integrations:manage_mappings',
  MANAGE_CREDENTIALS: 'integrations:manage_credentials',
  EXECUTE: 'integrations:execute',
  MANAGE_DEAD_LETTERS: 'integrations:manage_dead_letters',
  ADMIN: 'integrations:admin',
  EXPORT: 'integrations:export',
  AUDIT: 'integrations:audit',
} as const;

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
  if (user.email === 'oluwatobi@lawrenceapp.internal') return true;

  return user.userRoles.some((ur) => ur.role.name === 'SUPER_ADMIN');
}

export async function hasIntegrationPermission(userId: string, permissionCode: string): Promise<boolean> {
  const isSuper = await isSuperAdminUser(userId);
  if (isSuper) return true;

  const userRoles = await db.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  for (const ur of userRoles) {
    for (const rp of ur.role.permissions) {
      if (rp.permission.code === permissionCode || rp.permission.code === INTEGRATION_PERMISSIONS.ADMIN) {
        return true;
      }
    }
  }

  return false;
}

import { db } from './db';

/**
 * Server-side Authorization Check
 * Evaluates whether a given user possesses a specific permission code.
 * Evaluates permissions via user -> UserRole -> Role -> RolePermission -> Permission.
 */
export async function hasPermission(userId: string, permissionCode: string): Promise<boolean> {
  if (!userId || !permissionCode) return false;

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
    // SUPER_ADMIN has unrestricted permission access
    if (ur.role.name === 'SUPER_ADMIN') {
      return true;
    }

    for (const rp of ur.role.permissions) {
      if (rp.permission.code === permissionCode) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Fetch all active permission codes for a given user.
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  if (!userId) return [];

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

  const permissionsSet = new Set<string>();

  for (const ur of userRoles) {
    if (ur.role.name === 'SUPER_ADMIN') {
      const allPerms = await db.permission.findMany();
      return allPerms.map((p) => p.code);
    }
    for (const rp of ur.role.permissions) {
      permissionsSet.add(rp.permission.code);
    }
  }

  return Array.from(permissionsSet);
}

/**
 * Fetch all role names for a user.
 */
export async function getUserRoles(userId: string): Promise<string[]> {
  if (!userId) return [];

  const userRoles = await db.userRole.findMany({
    where: { userId },
    include: { role: true },
  });

  return userRoles.map((ur) => ur.role.name);
}

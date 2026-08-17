import { hasPermission } from '@/lib/rbac';

export async function requireProjectRead(userId: string, targetProjectId?: string): Promise<boolean> {
  const canReadAll = await hasPermission(userId, 'projects:read_all');
  if (canReadAll) return true;

  const canReadTeam = await hasPermission(userId, 'projects:read_team');
  if (canReadTeam) return true;

  const canReadOwn = await hasPermission(userId, 'projects:read_own');
  if (canReadOwn) return true;

  throw new Error(`Unauthorized: User ${userId} lacks project read permissions.`);
}

export async function requireProjectCreate(userId: string): Promise<boolean> {
  const isAllowed =
    (await hasPermission(userId, 'projects:create')) ||
    (await hasPermission(userId, 'projects:admin'));

  if (!isAllowed) {
    throw new Error(`Unauthorized: User ${userId} lacks projects:create permission.`);
  }

  return true;
}

export async function requireProjectUpdate(userId: string): Promise<boolean> {
  const isAllowed =
    (await hasPermission(userId, 'projects:update')) ||
    (await hasPermission(userId, 'projects:admin'));

  if (!isAllowed) {
    throw new Error(`Unauthorized: User ${userId} lacks projects:update permission.`);
  }

  return true;
}

export async function requireProjectAdmin(userId: string): Promise<boolean> {
  const isAllowed = await hasPermission(userId, 'projects:admin');
  if (!isAllowed) {
    throw new Error(`Unauthorized: User ${userId} lacks projects:admin permission.`);
  }
  return true;
}

export async function requireServiceManagement(userId: string): Promise<boolean> {
  const isAllowed =
    (await hasPermission(userId, 'projects:manage_services')) ||
    (await hasPermission(userId, 'projects:admin'));

  if (!isAllowed) {
    throw new Error(`Unauthorized: User ${userId} lacks projects:manage_services permission.`);
  }
  return true;
}

export async function requireTemplateManagement(userId: string): Promise<boolean> {
  const isAllowed =
    (await hasPermission(userId, 'projects:manage_templates')) ||
    (await hasPermission(userId, 'projects:admin'));

  if (!isAllowed) {
    throw new Error(`Unauthorized: User ${userId} lacks projects:manage_templates permission.`);
  }
  return true;
}

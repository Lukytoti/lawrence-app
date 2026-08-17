import { hasPermission } from '@/lib/rbac';

export async function requireBillingRead(userId: string): Promise<boolean> {
  const canReadAll = await hasPermission(userId, 'billing:read_all');
  if (canReadAll) return true;

  const canReadTeam = await hasPermission(userId, 'billing:read_team');
  if (canReadTeam) return true;

  const canReadOwn = await hasPermission(userId, 'billing:read_own');
  if (canReadOwn) return true;

  throw new Error(`Unauthorized: User ${userId} lacks billing read permission.`);
}

export async function requireBillingCreate(userId: string): Promise<boolean> {
  const isAllowed =
    (await hasPermission(userId, 'billing:create')) ||
    (await hasPermission(userId, 'billing:admin'));

  if (!isAllowed) {
    throw new Error(`Unauthorized: User ${userId} lacks billing:create permission.`);
  }
  return true;
}

export async function requireBillingUpdate(userId: string): Promise<boolean> {
  const isAllowed =
    (await hasPermission(userId, 'billing:update')) ||
    (await hasPermission(userId, 'billing:admin'));

  if (!isAllowed) {
    throw new Error(`Unauthorized: User ${userId} lacks billing:update permission.`);
  }
  return true;
}

export async function requireBillingIssue(userId: string): Promise<boolean> {
  const isAllowed =
    (await hasPermission(userId, 'billing:issue')) ||
    (await hasPermission(userId, 'billing:admin'));

  if (!isAllowed) {
    throw new Error(`Unauthorized: User ${userId} lacks billing:issue permission.`);
  }
  return true;
}

export async function requirePaymentRecord(userId: string): Promise<boolean> {
  const isAllowed =
    (await hasPermission(userId, 'billing:record_payment')) ||
    (await hasPermission(userId, 'billing:admin'));

  if (!isAllowed) {
    throw new Error(`Unauthorized: User ${userId} lacks billing:record_payment permission.`);
  }
  return true;
}

export async function requireBillingReconcile(userId: string): Promise<boolean> {
  const isAllowed =
    (await hasPermission(userId, 'billing:reconcile')) ||
    (await hasPermission(userId, 'billing:admin'));

  if (!isAllowed) {
    throw new Error(`Unauthorized: User ${userId} lacks billing:reconcile permission.`);
  }
  return true;
}

export async function requireBillingAdmin(userId: string): Promise<boolean> {
  const isAllowed = await hasPermission(userId, 'billing:admin');
  if (!isAllowed) {
    throw new Error(`Unauthorized: User ${userId} lacks billing:admin permission.`);
  }
  return true;
}

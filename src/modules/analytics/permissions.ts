import { hasPermission } from '@/lib/rbac';

export async function requireAnalyticsRead(userId: string): Promise<boolean> {
  const canOwn = await hasPermission(userId, 'analytics:read_own');
  const canTeam = await hasPermission(userId, 'analytics:read_team');
  const canAll = await hasPermission(userId, 'analytics:read_all');

  if (!canOwn && !canTeam && !canAll) {
    throw new Error('Unauthorized: Missing analytics read permission.');
  }

  return true;
}

export async function requireFinancialAnalytics(userId: string): Promise<boolean> {
  const isAllowed = await hasPermission(userId, 'analytics:financial');
  if (!isAllowed) {
    throw new Error('Unauthorized: Missing analytics:financial permission.');
  }
  return true;
}

export async function requireCompensationAnalytics(userId: string): Promise<boolean> {
  const isAllowed = await hasPermission(userId, 'analytics:compensation');
  if (!isAllowed) {
    throw new Error('Unauthorized: Missing analytics:compensation permission.');
  }
  return true;
}

export async function requireAnalyticsExport(userId: string): Promise<boolean> {
  const isAllowed = await hasPermission(userId, 'analytics:export');
  if (!isAllowed) {
    throw new Error('Unauthorized: Missing analytics:export permission.');
  }
  return true;
}

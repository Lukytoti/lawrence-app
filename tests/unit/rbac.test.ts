import { describe, it, expect, vi } from 'vitest';
import { hasPermission } from '@/lib/rbac';
import { db } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  db: {
    userRole: {
      findMany: vi.fn(),
    },
    permission: {
      findMany: vi.fn(),
    },
  },
}));

describe('RBAC Permission Logic', () => {
  it('should return false for invalid userId or permissionCode', async () => {
    const result = await hasPermission('', 'users:read');
    expect(result).toBe(false);
  });

  it('should grant permission to SUPER_ADMIN role regardless of permission code', async () => {
    (db.userRole.findMany as any).mockResolvedValue([
      {
        role: {
          name: 'SUPER_ADMIN',
          permissions: [],
        },
      },
    ]);

    const res = await hasPermission('user-1', 'any:permission');
    expect(res).toBe(true);
  });

  it('should grant permission if standard role contains the requested permission code', async () => {
    (db.userRole.findMany as any).mockResolvedValue([
      {
        role: {
          name: 'ADMIN',
          permissions: [
            {
              permission: { code: 'users:read' },
            },
          ],
        },
      },
    ]);

    const res = await hasPermission('user-2', 'users:read');
    expect(res).toBe(true);

    const failRes = await hasPermission('user-2', 'roles:manage');
    expect(failRes).toBe(false);
  });
});

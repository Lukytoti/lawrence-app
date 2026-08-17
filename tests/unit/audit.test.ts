import { describe, it, expect, vi } from 'vitest';
import { logAuditEvent } from '@/lib/audit';
import { db } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  db: {
    auditLog: {
      create: vi.fn(),
    },
  },
}));

describe('Audit Logger Service', () => {
  it('should record audit event correctly with JSON stringified metadata', async () => {
    const mockCreated = { id: 'audit-1', action: 'USER_LOGIN' };
    (db.auditLog.create as any).mockResolvedValue(mockCreated);

    const result = await logAuditEvent({
      actorId: 'user-123',
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: 'user-123',
      metadata: { ip: '127.0.0.1' },
    });

    expect(db.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorId: 'user-123',
        action: 'USER_LOGIN',
        entityType: 'User',
        entityId: 'user-123',
        metadata: JSON.stringify({ ip: '127.0.0.1' }),
        ipAddress: undefined,
        userAgent: undefined,
      },
    });

    expect(result).toEqual(mockCreated);
  });
});

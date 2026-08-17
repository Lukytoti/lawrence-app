import { db } from './db';

export interface AuditLogPayload {
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Record an immutable audit log entry.
 */
export async function logAuditEvent(payload: AuditLogPayload) {
  try {
    const auditRecord = await db.auditLog.create({
      data: {
        actorId: payload.actorId,
        action: payload.action,
        entityType: payload.entityType,
        entityId: payload.entityId,
        metadata: payload.metadata ? JSON.stringify(payload.metadata) : null,
        ipAddress: payload.ipAddress,
        userAgent: payload.userAgent,
      },
    });
    return auditRecord;
  } catch (error) {
    console.error('[AuditService] Failed to record audit log:', error);
    // Non-blocking for application flow
    return null;
  }
}

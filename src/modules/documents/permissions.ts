import { db } from '@/lib/db';
import { hasPermission } from '@/lib/rbac';

export const DOCUMENT_PERMISSIONS = {
  READ_OWN: 'documents:read_own',
  READ_TEAM: 'documents:read_team',
  READ_ALL: 'documents:read_all',
  CREATE: 'documents:create',
  UPDATE: 'documents:update',
  DELETE: 'documents:delete',
  UPLOAD: 'documents:upload',
  DOWNLOAD: 'documents:download',
  SHARE: 'documents:share',
  APPROVE: 'documents:approve',
  MANAGE_FOLDERS: 'documents:manage_folders',
  MANAGE_PERMISSIONS: 'documents:manage_permissions',
  MANAGE_KNOWLEDGE: 'documents:manage_knowledge',
  PUBLISH_KNOWLEDGE: 'documents:publish_knowledge',
  MANAGE_RETENTION: 'documents:manage_retention',
  MANAGE_LEGAL_HOLD: 'documents:manage_legal_hold',
  ADMIN: 'documents:admin',
  EXPORT: 'documents:export',
  AUDIT: 'documents:audit',
} as const;

export async function hasDocumentPermission(
  userId: string,
  permission: string
): Promise<boolean> {
  // If user has admin permission, grant access
  const isAdmin = await hasPermission(userId, DOCUMENT_PERMISSIONS.ADMIN);
  if (isAdmin) return true;

  return await hasPermission(userId, permission);
}

/**
 * Evaluates whether actor can view a document based on:
 * 1. Admin / read_all RBAC
 * 2. Owner of document
 * 3. Explicit DocumentPermission assigned to user/role
 * 4. Active DocumentShare link
 * 5. Visibility (PUBLIC / ORGANIZATION / TEAM)
 */
export async function canViewDocument(
  actorUserId: string,
  documentId: string
): Promise<boolean> {
  const isAdmin = await hasPermission(actorUserId, DOCUMENT_PERMISSIONS.ADMIN);
  if (isAdmin) return true;

  const hasReadAll = await hasPermission(actorUserId, DOCUMENT_PERMISSIONS.READ_ALL);
  if (hasReadAll) return true;

  const doc = await db.document.findUnique({
    where: { id: documentId },
    include: {
      permissions: true,
      shares: true,
    },
  });

  if (!doc) return false;

  // If owner
  if (doc.ownerId === actorUserId) return true;

  // If classification is RESTRICTED, only owner, explicit permission or admin can view
  if (doc.classification === 'RESTRICTED') {
    const explicitPerm = doc.permissions.find(
      p => p.subjectId === actorUserId && ['VIEW', 'DOWNLOAD', 'EDIT', 'SHARE', 'APPROVE', 'DELETE'].includes(p.permission)
    );
    if (explicitPerm) return true;
    return false;
  }

  // If PUBLIC or ORGANIZATION visibility
  if (doc.visibility === 'PUBLIC') return true;
  if (doc.visibility === 'ORGANIZATION') {
    const canReadOwn = await hasPermission(actorUserId, DOCUMENT_PERMISSIONS.READ_OWN);
    return canReadOwn || true;
  }

  // Check explicit permissions
  const explicit = doc.permissions.find(
    p => p.subjectId === actorUserId && ['VIEW', 'DOWNLOAD', 'EDIT', 'SHARE', 'APPROVE', 'DELETE'].includes(p.permission)
  );
  if (explicit) return true;

  // Check active shares
  const now = new Date();
  const share = doc.shares.find(
    s => s.sharedWithId === actorUserId && (!s.expiresAt || s.expiresAt > now) && !s.revokedAt
  );
  if (share) return true;

  return false;
}

export async function canDownloadDocument(
  actorUserId: string,
  documentId: string
): Promise<boolean> {
  const isAdmin = await hasPermission(actorUserId, DOCUMENT_PERMISSIONS.ADMIN);
  if (isAdmin) return true;

  const doc = await db.document.findUnique({
    where: { id: documentId },
    include: { permissions: true, shares: true },
  });

  if (!doc) return false;
  if (doc.ownerId === actorUserId) return true;

  // Check explicit download permission
  const explicit = doc.permissions.find(
    p => p.subjectId === actorUserId && ['DOWNLOAD', 'EDIT', 'SHARE', 'APPROVE', 'DELETE'].includes(p.permission)
  );
  if (explicit) return true;

  const now = new Date();
  const share = doc.shares.find(
    s => s.sharedWithId === actorUserId && ['DOWNLOAD', 'EDIT'].includes(s.permission) && (!s.expiresAt || s.expiresAt > now) && !s.revokedAt
  );
  if (share) return true;

  return await canViewDocument(actorUserId, documentId);
}

export async function canEditDocument(
  actorUserId: string,
  documentId: string
): Promise<boolean> {
  const isAdmin = await hasPermission(actorUserId, DOCUMENT_PERMISSIONS.ADMIN);
  if (isAdmin) return true;

  const doc = await db.document.findUnique({
    where: { id: documentId },
    include: { permissions: true },
  });

  if (!doc) return false;
  if (doc.ownerId === actorUserId) return true;

  const explicit = doc.permissions.find(
    p => p.subjectId === actorUserId && ['EDIT', 'DELETE'].includes(p.permission)
  );
  if (explicit) return true;

  const hasUpdate = await hasPermission(actorUserId, DOCUMENT_PERMISSIONS.UPDATE);
  return hasUpdate && doc.classification !== 'RESTRICTED';
}

export async function canShareDocument(
  actorUserId: string,
  documentId: string
): Promise<boolean> {
  const isAdmin = await hasPermission(actorUserId, DOCUMENT_PERMISSIONS.ADMIN);
  if (isAdmin) return true;

  const doc = await db.document.findUnique({
    where: { id: documentId },
    include: { permissions: true },
  });

  if (!doc) return false;
  if (doc.ownerId === actorUserId) return true;

  const explicit = doc.permissions.find(
    p => p.subjectId === actorUserId && ['SHARE', 'EDIT', 'DELETE'].includes(p.permission)
  );
  if (explicit) return true;

  return await hasPermission(actorUserId, DOCUMENT_PERMISSIONS.SHARE);
}

export async function canApproveDocument(
  actorUserId: string,
  documentId: string
): Promise<boolean> {
  const isAdmin = await hasPermission(actorUserId, DOCUMENT_PERMISSIONS.ADMIN);
  if (isAdmin) return true;

  const doc = await db.document.findUnique({
    where: { id: documentId },
    include: { permissions: true },
  });

  if (!doc) return false;

  const explicit = doc.permissions.find(
    p => p.subjectId === actorUserId && ['APPROVE', 'DELETE'].includes(p.permission)
  );
  if (explicit) return true;

  return await hasPermission(actorUserId, DOCUMENT_PERMISSIONS.APPROVE);
}

export async function canDeleteDocument(
  actorUserId: string,
  documentId: string
): Promise<boolean> {
  const doc = await db.document.findUnique({
    where: { id: documentId },
    include: { permissions: true, legalHolds: { where: { status: 'ACTIVE' } } },
  });

  if (!doc) return false;

  // Active legal hold blocks deletion for everyone including Admin
  if (doc.legalHolds.length > 0) {
    return false;
  }

  const isAdmin = await hasPermission(actorUserId, DOCUMENT_PERMISSIONS.ADMIN);
  if (isAdmin) return true;

  if (doc.ownerId === actorUserId) return true;

  const explicit = doc.permissions.find(
    p => p.subjectId === actorUserId && p.permission === 'DELETE'
  );
  if (explicit) return true;

  return await hasPermission(actorUserId, DOCUMENT_PERMISSIONS.DELETE);
}

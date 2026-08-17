import { db } from '@/lib/db';
import { CreateFolderInput } from './types';
import { generateCorrelationId, sanitizeForAudit } from './security';
import { DOCUMENT_PERMISSIONS, hasDocumentPermission } from './permissions';

/**
 * Check if moving folderId to targetParentFolderId would create a cycle.
 */
export async function wouldCreateFolderCycle(folderId: string, targetParentFolderId: string): Promise<boolean> {
  if (folderId === targetParentFolderId) return true;

  let currentId: string | null = targetParentFolderId;
  const visited = new Set<string>();

  while (currentId) {
    if (visited.has(currentId) || currentId === folderId) {
      return true;
    }
    visited.add(currentId);

    const parent: { parentFolderId: string | null } | null = await db.documentFolder.findUnique({
      where: { id: currentId },
      select: { parentFolderId: true },
    });

    currentId = parent?.parentFolderId || null;
  }

  return false;
}

export async function createFolder(input: CreateFolderInput, actorUserId: string) {
  const hasPerm = await hasDocumentPermission(actorUserId, DOCUMENT_PERMISSIONS.MANAGE_FOLDERS);
  const canCreate = await hasDocumentPermission(actorUserId, DOCUMENT_PERMISSIONS.CREATE);
  if (!hasPerm && !canCreate) {
    throw new Error('Unauthorized: Missing documents:manage_folders or documents:create permission');
  }

  if (input.parentFolderId) {
    const parent = await db.documentFolder.findUnique({ where: { id: input.parentFolderId } });
    if (!parent) {
      throw new Error(`Parent folder not found: ${input.parentFolderId}`);
    }
  }

  const folderCode = `FLD_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

  const folder = await db.documentFolder.create({
    data: {
      folderCode,
      name: input.name,
      description: input.description,
      parentFolderId: input.parentFolderId,
      ownerId: actorUserId,
      visibility: input.visibility || 'ORGANIZATION',
    },
  });

  return sanitizeForAudit(folder);
}

export async function renameFolder(folderId: string, name: string, actorUserId: string) {
  const folder = await db.documentFolder.findUnique({ where: { id: folderId } });
  if (!folder) throw new Error('Folder not found');

  const hasManage = await hasDocumentPermission(actorUserId, DOCUMENT_PERMISSIONS.MANAGE_FOLDERS);
  if (folder.ownerId !== actorUserId && !hasManage) {
    throw new Error('Unauthorized: You do not own this folder');
  }

  const updated = await db.documentFolder.update({
    where: { id: folderId },
    data: { name },
  });

  return sanitizeForAudit(updated);
}

export async function moveFolder(folderId: string, targetParentFolderId: string | null, actorUserId: string) {
  const folder = await db.documentFolder.findUnique({ where: { id: folderId } });
  if (!folder) throw new Error('Folder not found');

  const hasManage = await hasDocumentPermission(actorUserId, DOCUMENT_PERMISSIONS.MANAGE_FOLDERS);
  if (folder.ownerId !== actorUserId && !hasManage) {
    throw new Error('Unauthorized: You do not own this folder');
  }

  if (targetParentFolderId) {
    const isCycle = await wouldCreateFolderCycle(folderId, targetParentFolderId);
    if (isCycle) {
      throw new Error('Cannot move folder: Circular folder hierarchy detected');
    }
  }

  const updated = await db.documentFolder.update({
    where: { id: folderId },
    data: { parentFolderId: targetParentFolderId },
  });

  return sanitizeForAudit(updated);
}

export async function listFolderContents(folderId: string | null, actorUserId: string) {
  const [subFolders, documents] = await Promise.all([
    db.documentFolder.findMany({
      where: { parentFolderId: folderId },
      orderBy: { name: 'asc' },
    }),
    db.document.findMany({
      where: { folderId: folderId, isArchived: false },
      orderBy: { title: 'asc' },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  return sanitizeForAudit({
    folderId,
    subFolders,
    documents,
  });
}

export async function deleteFolder(folderId: string, actorUserId: string) {
  const folder = await db.documentFolder.findUnique({
    where: { id: folderId },
    include: { subFolders: true, documents: true },
  });
  if (!folder) throw new Error('Folder not found');

  const hasManage = await hasDocumentPermission(actorUserId, DOCUMENT_PERMISSIONS.MANAGE_FOLDERS);
  if (folder.ownerId !== actorUserId && !hasManage) {
    throw new Error('Unauthorized: You do not own this folder');
  }

  if (folder.isSystem) {
    throw new Error('Cannot delete system folder');
  }

  if (folder.subFolders.length > 0 || folder.documents.length > 0) {
    throw new Error('Cannot delete non-empty folder. Move or delete child contents first');
  }

  await db.documentFolder.delete({ where: { id: folderId } });
  return { success: true, deletedFolderId: folderId };
}

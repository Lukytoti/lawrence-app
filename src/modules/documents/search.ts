import { db } from '@/lib/db';
import { DocumentSearchFilters } from './types';
import { DOCUMENT_PERMISSIONS, hasDocumentPermission } from './permissions';
import { sanitizeForAudit } from './security';

export async function searchDocuments(filters: DocumentSearchFilters, actorUserId: string) {
  const page = Math.max(1, filters.page || 1);
  const limit = Math.min(100, Math.max(1, filters.limit || 20));
  const skip = (page - 1) * limit;

  const isAdmin = await hasDocumentPermission(actorUserId, DOCUMENT_PERMISSIONS.ADMIN);
  const hasReadAll = await hasDocumentPermission(actorUserId, DOCUMENT_PERMISSIONS.READ_ALL);

  const where: any = {};

  // Archival filter
  if (filters.isArchived !== undefined) {
    where.isArchived = filters.isArchived;
  } else {
    where.isArchived = false;
  }

  // Type filter
  if (filters.documentType) {
    where.documentType = filters.documentType;
  }

  // Status filter
  if (filters.status) {
    where.status = filters.status;
  }

  // Classification filter
  if (filters.classification) {
    where.classification = filters.classification;
  }

  // Visibility filter
  if (filters.visibility) {
    where.visibility = filters.visibility;
  }

  // Folder filter
  if (filters.folderId) {
    where.folderId = filters.folderId;
  }

  // Owner filter
  if (filters.ownerId) {
    where.ownerId = filters.ownerId;
  }

  // Text search on title or description
  if (filters.query && filters.query.trim()) {
    const q = filters.query.trim();
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { documentCode: { contains: q, mode: 'insensitive' } },
    ];
  }

  // Date range filter
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
    if (filters.dateTo) where.createdAt.lte = filters.dateTo;
  }

  // Tags filter
  if (filters.tags && filters.tags.length > 0) {
    where.tags = {
      some: {
        tag: {
          name: { in: filters.tags },
        },
      },
    };
  }

  // Authorization filter: If not admin/read_all, scope to user's permitted documents
  if (!isAdmin && !hasReadAll) {
    where.AND = [
      {
        OR: [
          { ownerId: actorUserId },
          { visibility: 'PUBLIC' },
          { visibility: 'ORGANIZATION', classification: { not: 'RESTRICTED' } },
          { permissions: { some: { subjectId: actorUserId } } },
          { shares: { some: { sharedWithId: actorUserId, revokedAt: null } } },
        ],
      },
    ];
  }

  const [documents, totalCount] = await Promise.all([
    db.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        folder: { select: { id: true, name: true, folderCode: true } },
        tags: { include: { tag: true } },
        metadata: true,
      },
    }),
    db.document.count({ where }),
  ]);

  return sanitizeForAudit({
    documents,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: skip + documents.length < totalCount,
    },
  });
}

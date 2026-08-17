import { db } from '@/lib/db';
import {
  CreateKnowledgeCollectionInput,
  CreateKnowledgeEntryInput,
  KnowledgeStatus,
} from './types';
import { DOCUMENT_PERMISSIONS, hasDocumentPermission } from './permissions';
import { computeSha256Checksum, generateCorrelationId, sanitizeForAudit } from './security';
import { EventBus } from '@/lib/events';

export async function createKnowledgeCollection(
  input: CreateKnowledgeCollectionInput,
  actorUserId: string
) {
  const hasManage = await hasDocumentPermission(actorUserId, DOCUMENT_PERMISSIONS.MANAGE_KNOWLEDGE);
  if (!hasManage) {
    throw new Error('Unauthorized: Missing documents:manage_knowledge permission');
  }

  const collectionCode = `KC_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

  const collection = await db.knowledgeCollection.create({
    data: {
      collectionCode,
      name: input.name,
      description: input.description,
      visibility: input.visibility || 'ORGANIZATION',
      ownerId: actorUserId,
      isActive: true,
    },
  });

  return sanitizeForAudit(collection);
}

export async function createKnowledgeEntry(
  input: CreateKnowledgeEntryInput,
  actorUserId: string
) {
  const hasManage = await hasDocumentPermission(actorUserId, DOCUMENT_PERMISSIONS.MANAGE_KNOWLEDGE);
  const canCreate = await hasDocumentPermission(actorUserId, DOCUMENT_PERMISSIONS.CREATE);
  if (!hasManage && !canCreate) {
    throw new Error('Unauthorized: Missing permission to create knowledge entries');
  }

  const collection = await db.knowledgeCollection.findUnique({
    where: { id: input.collectionId },
  });

  if (!collection) throw new Error('Knowledge collection not found');

  const entryCode = `KNE_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

  const entry = await db.$transaction(async (tx) => {
    const kne = await tx.knowledgeEntry.create({
      data: {
        entryCode,
        collectionId: input.collectionId,
        title: input.title,
        content: input.content,
        status: 'DRAFT',
        sourceDocumentId: input.sourceDocumentId,
        authorId: actorUserId,
      },
    });

    // Generate initial chunks
    const chunks = chunkText(input.content);
    for (let i = 0; i < chunks.length; i++) {
      const chunkTextContent = chunks[i];
      await tx.knowledgeChunk.create({
        data: {
          entryCode: `${entryCode}_CHK_${i}`,
          knowledgeEntryId: kne.id,
          chunkIndex: i,
          content: chunkTextContent,
          tokenCount: Math.ceil(chunkTextContent.length / 4),
          checksum: computeSha256Checksum(chunkTextContent),
        },
      });
    }

    return kne;
  });

  return sanitizeForAudit(entry);
}

export async function updateKnowledgeEntry(
  entryId: string,
  data: { title?: string; content?: string },
  actorUserId: string
) {
  const entry = await db.knowledgeEntry.findUnique({ where: { id: entryId } });
  if (!entry) throw new Error('Knowledge entry not found');

  const hasManage = await hasDocumentPermission(actorUserId, DOCUMENT_PERMISSIONS.MANAGE_KNOWLEDGE);
  if (entry.authorId !== actorUserId && !hasManage) {
    throw new Error('Unauthorized to update this knowledge entry');
  }

  const updated = await db.$transaction(async (tx) => {
    const kne = await tx.knowledgeEntry.update({
      where: { id: entryId },
      data: {
        title: data.title,
        content: data.content,
        version: { increment: 1 },
      },
    });

    if (data.content) {
      // Re-generate chunks
      await tx.knowledgeChunk.deleteMany({ where: { knowledgeEntryId: entryId } });
      const chunks = chunkText(data.content);
      for (let i = 0; i < chunks.length; i++) {
        const chunkTextContent = chunks[i];
        await tx.knowledgeChunk.create({
          data: {
            entryCode: `${kne.entryCode}_CHK_${i}`,
            knowledgeEntryId: kne.id,
            chunkIndex: i,
            content: chunkTextContent,
            tokenCount: Math.ceil(chunkTextContent.length / 4),
            checksum: computeSha256Checksum(chunkTextContent),
          },
        });
      }
    }

    return kne;
  });

  return sanitizeForAudit(updated);
}

export async function submitKnowledgeForReview(entryId: string, actorUserId: string) {
  const entry = await db.knowledgeEntry.findUnique({ where: { id: entryId } });
  if (!entry) throw new Error('Knowledge entry not found');

  const updated = await db.knowledgeEntry.update({
    where: { id: entryId },
    data: { status: 'UNDER_REVIEW' },
  });

  return sanitizeForAudit(updated);
}

export async function publishKnowledgeEntry(entryId: string, approvedByUserId: string) {
  const hasPublish = await hasDocumentPermission(approvedByUserId, DOCUMENT_PERMISSIONS.PUBLISH_KNOWLEDGE);
  if (!hasPublish) {
    throw new Error('Unauthorized: Missing documents:publish_knowledge permission');
  }

  const updated = await db.knowledgeEntry.update({
    where: { id: entryId },
    data: {
      status: 'PUBLISHED',
      approvedById: approvedByUserId,
      publishedAt: new Date(),
    },
  });

  EventBus.publish({
    id: `evt_${Date.now()}`,
    type: 'KnowledgePublished',
    actorId: approvedByUserId,
    payload: {
      entryId: updated.id,
      entryCode: updated.entryCode,
      collectionId: updated.collectionId,
      title: updated.title,
    },
    timestamp: new Date(),
  });

  return sanitizeForAudit(updated);
}

export async function archiveKnowledgeEntry(entryId: string, actorUserId: string) {
  const hasManage = await hasDocumentPermission(actorUserId, DOCUMENT_PERMISSIONS.MANAGE_KNOWLEDGE);
  if (!hasManage) {
    throw new Error('Unauthorized: Missing documents:manage_knowledge permission');
  }

  const updated = await db.knowledgeEntry.update({
    where: { id: entryId },
    data: { status: 'ARCHIVED' },
  });

  EventBus.publish({
    id: `evt_${Date.now()}`,
    type: 'KnowledgeArchived',
    actorId: actorUserId,
    payload: {
      entryId: updated.id,
      entryCode: updated.entryCode,
    },
    timestamp: new Date(),
  });

  return sanitizeForAudit(updated);
}

export async function searchKnowledge(
  query: string,
  collectionId?: string,
  includeDrafts: boolean = false
) {
  const where: any = {};

  if (collectionId) {
    where.collectionId = collectionId;
  }

  if (!includeDrafts) {
    where.status = 'PUBLISHED';
  }

  if (query && query.trim()) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { content: { contains: query, mode: 'insensitive' } },
    ];
  }

  const entries = await db.knowledgeEntry.findMany({
    where,
    orderBy: { publishedAt: 'desc' },
    include: {
      collection: { select: { id: true, name: true, collectionCode: true } },
      author: { select: { id: true, name: true, email: true } },
      chunks: { take: 3 },
    },
    take: 50,
  });

  return sanitizeForAudit(entries);
}

export async function getPublishedKnowledge(collectionId?: string) {
  return await searchKnowledge('', collectionId, false);
}

/**
 * Split text into semantic / size-bounded chunks (approx 500-1000 characters).
 */
function chunkText(text: string, chunkSize: number = 800): string[] {
  if (!text) return [];
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    if ((currentChunk + '\n\n' + para).length > chunkSize && currentChunk.trim()) {
      chunks.push(currentChunk.trim());
      currentChunk = para;
    } else {
      currentChunk = currentChunk ? `${currentChunk}\n\n${para}` : para;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [text.trim()];
}

// ---------------------------------------------------------------------------
// Knowledge & RAG Integration Provider for Prompt 15 AI
// ---------------------------------------------------------------------------
export async function searchAuthorizedKnowledge(query: string, actorUserId: string) {
  // Only return published entries
  return await searchKnowledge(query, undefined, false);
}

export async function getAuthorizedKnowledgeChunks(knowledgeEntryId: string, actorUserId: string) {
  const entry = await db.knowledgeEntry.findUnique({
    where: { id: knowledgeEntryId },
    include: { chunks: { orderBy: { chunkIndex: 'asc' } } },
  });

  if (!entry) throw new Error('Knowledge entry not found');
  if (entry.status !== 'PUBLISHED') {
    const hasManage = await hasDocumentPermission(actorUserId, DOCUMENT_PERMISSIONS.MANAGE_KNOWLEDGE);
    if (!hasManage && entry.authorId !== actorUserId) {
      throw new Error('Access denied to unpublished knowledge chunks');
    }
  }

  return sanitizeForAudit(entry.chunks);
}

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import KnowledgeLibraryClient from '@/modules/documents/components/KnowledgeLibraryClient';

export default async function KnowledgeHubPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const admin = await db.user.findFirst({ where: { status: 'ACTIVE' } });
  const userId = user?.id || admin?.id || 'SYSTEM';

  const [collections, entries] = await Promise.all([
    db.knowledgeCollection.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
    db.knowledgeEntry.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        collection: { select: { id: true, name: true, collectionCode: true } },
        author: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  return (
    <KnowledgeLibraryClient
      collections={collections}
      entries={entries}
      currentUserId={userId}
    />
  );
}

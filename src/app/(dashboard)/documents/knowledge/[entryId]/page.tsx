import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import KnowledgeEditorClient from '@/modules/documents/components/KnowledgeEditorClient';

export default async function KnowledgeEntryDetailPage({
  params,
}: {
  params: Promise<{ entryId: string }>;
}) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const admin = await db.user.findFirst({ where: { status: 'ACTIVE' } });
  const userId = user?.id || admin?.id || 'SYSTEM';

  const { entryId } = await params;

  const entry = await db.knowledgeEntry.findUnique({
    where: { id: entryId },
    include: {
      collection: true,
      author: { select: { id: true, name: true, email: true } },
    },
  });

  if (!entry) {
    notFound();
  }

  return <KnowledgeEditorClient entry={entry} currentUserId={userId} />;
}

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { searchDocuments } from '@/modules/documents/search';
import DocumentLibraryClient from '@/modules/documents/components/DocumentLibraryClient';

export default async function DocumentLibraryPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const admin = await db.user.findFirst({ where: { status: 'ACTIVE' } });
  const userId = user?.id || admin?.id || 'SYSTEM';

  const [docsResult, folders] = await Promise.all([
    searchDocuments({ limit: 50 }, userId),
    db.documentFolder.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return (
    <DocumentLibraryClient
      initialDocuments={docsResult.documents}
      folders={folders}
      currentUserId={userId}
    />
  );
}

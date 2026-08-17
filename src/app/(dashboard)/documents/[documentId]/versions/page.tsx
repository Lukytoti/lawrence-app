import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { getDocument } from '@/modules/documents/service';
import { listDocumentVersions } from '@/modules/documents/versions';
import DocumentVersionClient from '@/modules/documents/components/DocumentVersionClient';
import { db } from '@/lib/db';

export default async function DocumentVersionsPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const admin = await db.user.findFirst({ where: { status: 'ACTIVE' } });
  const userId = user?.id || admin?.id || 'SYSTEM';

  const { documentId } = await params;

  try {
    const [doc, versions] = await Promise.all([
      getDocument(documentId, userId),
      listDocumentVersions(documentId, userId),
    ]);

    return (
      <DocumentVersionClient
        document={doc}
        versions={versions}
        currentUserId={userId}
      />
    );
  } catch (err) {
    notFound();
  }
}

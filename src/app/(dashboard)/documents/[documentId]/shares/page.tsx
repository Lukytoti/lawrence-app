import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { getDocument } from '@/modules/documents/service';
import { getActiveShares } from '@/modules/documents/sharing';
import DocumentShareClient from '@/modules/documents/components/DocumentShareClient';
import { db } from '@/lib/db';

export default async function DocumentSharesPage({
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
    const [doc, shares] = await Promise.all([
      getDocument(documentId, userId),
      getActiveShares(documentId, userId),
    ]);

    return (
      <DocumentShareClient
        document={doc}
        shares={shares}
        currentUserId={userId}
      />
    );
  } catch (err) {
    notFound();
  }
}

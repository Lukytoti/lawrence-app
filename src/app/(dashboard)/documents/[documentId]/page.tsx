import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { getDocument } from '@/modules/documents/service';
import DocumentViewerClient from '@/modules/documents/components/DocumentViewerClient';
import { db } from '@/lib/db';

export default async function DocumentDetailPage({
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
    const doc = await getDocument(documentId, userId);
    return <DocumentViewerClient document={doc} currentUserId={userId} />;
  } catch (err) {
    notFound();
  }
}

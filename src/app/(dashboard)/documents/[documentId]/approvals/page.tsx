import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { getDocument } from '@/modules/documents/service';
import { getApprovalHistory } from '@/modules/documents/approvals';
import DocumentApprovalClient from '@/modules/documents/components/DocumentApprovalClient';
import { db } from '@/lib/db';

export default async function DocumentApprovalsPage({
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
    const [doc, approvals] = await Promise.all([
      getDocument(documentId, userId),
      getApprovalHistory(documentId, userId),
    ]);

    return (
      <DocumentApprovalClient
        document={doc}
        approvals={approvals}
        currentUserId={userId}
      />
    );
  } catch (err) {
    notFound();
  }
}

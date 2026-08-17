import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import DocumentAuditClient from '@/modules/documents/components/DocumentAuditClient';

export default async function DocumentAuditPage() {
  const session = await getServerSession(authOptions);

  const logs = await db.documentActivityLog.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      actor: { select: { id: true, name: true, email: true } },
      document: { select: { id: true, title: true, documentCode: true } },
    },
    take: 100,
  });

  return <DocumentAuditClient logs={logs} />;
}

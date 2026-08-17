import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { getDocument } from '@/modules/documents/service';
import { db } from '@/lib/db';
import DocumentPermissionClient from '@/modules/documents/components/DocumentPermissionClient';

export default async function DocumentPermissionsPage({
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
    const [doc, perms] = await Promise.all([
      getDocument(documentId, userId),
      db.documentPermission.findMany({
        where: { documentId },
        include: { grantedBy: { select: { id: true, name: true, email: true } } },
      }),
    ]);

    return (
      <DocumentPermissionClient
        document={doc}
        permissions={perms}
        currentUserId={userId}
      />
    );
  } catch (err) {
    notFound();
  }
}

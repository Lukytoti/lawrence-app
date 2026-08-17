import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import FolderBrowserClient from '@/modules/documents/components/FolderBrowserClient';

export default async function DocumentFoldersPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const admin = await db.user.findFirst({ where: { status: 'ACTIVE' } });
  const userId = user?.id || admin?.id || 'SYSTEM';

  const folders = await db.documentFolder.findMany({
    orderBy: { name: 'asc' },
  });

  return <FolderBrowserClient initialFolders={folders} currentUserId={userId} />;
}

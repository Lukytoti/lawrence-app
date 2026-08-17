import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getDocumentsDashboardOverview } from '@/modules/documents/service';
import DocumentDashboardClient from '@/modules/documents/components/DocumentDashboardClient';
import { db } from '@/lib/db';

export default async function DocumentsPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const admin = await db.user.findFirst({ where: { status: 'ACTIVE' } });
  const userId = user?.id || admin?.id || 'SYSTEM';

  const overview = await getDocumentsDashboardOverview(userId);

  return <DocumentDashboardClient overview={overview} />;
}

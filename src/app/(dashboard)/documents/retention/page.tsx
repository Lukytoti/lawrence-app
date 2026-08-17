import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { listRetentionPolicies, getRetentionDueDocuments } from '@/modules/documents/retention';
import RetentionRecordsClient from '@/modules/documents/components/RetentionRecordsClient';

export default async function RetentionRecordsPage() {
  const session = await getServerSession(authOptions);

  const [policies, dueDocs] = await Promise.all([
    listRetentionPolicies(),
    getRetentionDueDocuments(),
  ]);

  return <RetentionRecordsClient policies={policies} dueDocuments={dueDocs} />;
}

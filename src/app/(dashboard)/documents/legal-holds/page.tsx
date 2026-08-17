import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { listLegalHolds } from '@/modules/documents/retention';
import LegalHoldClient from '@/modules/documents/components/LegalHoldClient';

export default async function LegalHoldsPage() {
  const session = await getServerSession(authOptions);
  const holds = await listLegalHolds();

  return <LegalHoldClient holds={holds} />;
}

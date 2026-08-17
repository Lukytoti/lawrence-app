import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { hasPermission } from '@/lib/rbac';
import { CompensationCockpitClient } from '@/modules/compensation/components/CompensationCockpitClient';

export default async function CompensationAdminPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) {
    return <div className="p-6 text-white text-xs">Please log in to view compensation cockpit.</div>;
  }

  const canRead = await hasPermission(userId, 'finance:compensation:read');
  if (!canRead) {
    return <div className="p-6 text-white text-xs">Forbidden: You do not have permission to view compensation cockpit.</div>;
  }

  const runs = await db.compensationRun.findMany({
    orderBy: { createdAt: 'desc' },
    include: { period: true, planVersion: true },
  });

  const periods = await db.qualificationPeriod.findMany({
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  });

  const planVersions = await db.planVersion.findMany({
    where: { status: 'ACTIVE' },
    include: { plan: true },
  });

  return (
    <CompensationCockpitClient
      runs={runs}
      periods={periods}
      planVersions={planVersions}
      currentUserId={userId}
    />
  );
}

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { hasPermission } from '@/lib/rbac';
import { getMemberTrainingAssignments } from '@/modules/community/training';
import { TrainingCenterClient } from '@/modules/community/components/TrainingCenterClient';

export default async function TrainingPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) {
    return <div className="p-6 text-white text-xs">Please log in to view training modules.</div>;
  }

  const member = await db.networkMember.findUnique({
    where: { userId },
  });

  const assignments = member ? await getMemberTrainingAssignments(member.id) : [];
  const canManage = await hasPermission(userId, 'community:training:create');
  const trainingModules = await db.trainingModule.findMany({
    where: { published: true, archivedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <TrainingCenterClient
      assignments={assignments}
      canManage={canManage}
      trainingModules={trainingModules}
    />
  );
}

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { getActiveLeadershipAttentionAlerts } from '@/modules/community/attention';
import { LeadershipAnalyticsClient } from '@/modules/community/components/LeadershipAnalyticsClient';

export default async function CommunityAnalyticsPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) {
    return <div className="p-6 text-white text-xs">Please log in to view community analytics.</div>;
  }

  const canReadAnalytics = await hasPermission(userId, 'community:analytics:read');
  if (!canReadAnalytics) {
    return <div className="p-6 text-white text-xs">Forbidden: You do not have permission to view community analytics.</div>;
  }

  const alerts = await getActiveLeadershipAttentionAlerts();

  return <LeadershipAnalyticsClient attentionAlerts={alerts} />;
}

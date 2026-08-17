import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUserAiInsights } from '@/modules/ai/insights';
import { AiInsightListClient } from '@/modules/ai/components/AiInsightListClient';

export default async function AiInsightsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const userId = (session.user as any).id;
  const insights = await getUserAiInsights(userId);
  return <AiInsightListClient initialInsights={insights} userId={userId} />;
}

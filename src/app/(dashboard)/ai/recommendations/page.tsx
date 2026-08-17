import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AiRecommendationListClient } from '@/modules/ai/components/AiRecommendationListClient';

export default async function AiRecommendationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  return <AiRecommendationListClient />;
}

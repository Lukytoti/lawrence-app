import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAiCoachingPrompts } from '@/modules/ai/coaching';
import { AiCoachingClient } from '@/modules/ai/components/AiCoachingClient';

export default async function AiCoachingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const userId = (session.user as any).id;
  const prompts = await getAiCoachingPrompts();
  return <AiCoachingClient initialPrompts={prompts} userId={userId} />;
}

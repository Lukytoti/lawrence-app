import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AiChatClient } from '@/modules/ai/components/AiChatClient';

export default async function AiChatPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const userId = (session.user as any).id;
  return <AiChatClient userId={userId} />;
}

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getExecutiveAiDashboard } from '@/modules/ai/service';
import { AiDashboardClient } from '@/modules/ai/components/AiDashboardClient';

export default async function AiDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const userId = (session.user as any).id;
  const initialData = await getExecutiveAiDashboard(userId);
  return <AiDashboardClient initialData={initialData} userId={userId} />;
}

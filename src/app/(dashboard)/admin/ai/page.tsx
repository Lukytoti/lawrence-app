import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { assertAiPermission } from '@/modules/ai/permissions';
import { AdminAiClient } from '@/modules/ai/components/AdminAiClient';

export default async function AdminAiPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const userId = (session.user as any).id;
  try {
    await assertAiPermission(userId, 'ai:admin');
  } catch {
    redirect('/overview');
  }

  return <AdminAiClient />;
}

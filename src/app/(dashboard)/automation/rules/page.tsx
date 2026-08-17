import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { RuleListClient } from '@/modules/automation/components/RuleListClient';

export const dynamic = 'force-dynamic';

export default async function AutomationRulesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/login');

  const currentUser = await db.user.findUnique({
    where: { email: session.user.email },
  });
  if (!currentUser) redirect('/login');

  const rules = await db.automationRule.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return <RuleListClient rules={rules} />;
}

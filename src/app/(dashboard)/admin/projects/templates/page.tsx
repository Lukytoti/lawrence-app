import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getProjectTemplates } from '@/modules/projects/templates';
import { ProjectTemplatesClient } from '@/modules/projects/components/ProjectTemplatesClient';

export const dynamic = 'force-dynamic';

export default async function TemplatesAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/login');
  }

  const templates = await getProjectTemplates(false);

  return <ProjectTemplatesClient templates={templates} />;
}

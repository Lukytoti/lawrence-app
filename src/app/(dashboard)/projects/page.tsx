import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getProjects } from '@/modules/projects/projects';
import { ProjectCommandCenterClient } from '@/modules/projects/components/ProjectCommandCenterClient';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/login');
  }

  const currentUser = await db.user.findUnique({
    where: { email: session.user.email },
  });

  if (!currentUser) {
    redirect('/login');
  }

  const initialProjects = await getProjects();

  return <ProjectCommandCenterClient initialProjects={initialProjects} userId={currentUser.id} />;
}

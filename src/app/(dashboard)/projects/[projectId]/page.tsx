import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getProjectById } from '@/modules/projects/projects';
import { ProjectDetailClient } from '@/modules/projects/components/ProjectDetailClient';

export const dynamic = 'force-dynamic';

interface ProjectDetailPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
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

  const { projectId } = await params;
  const project = await getProjectById(projectId);

  return <ProjectDetailClient project={project} userId={currentUser.id} />;
}

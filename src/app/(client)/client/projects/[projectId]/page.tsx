import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { getClientPortalProjectData } from '@/modules/projects/client-portal';
import { ClientPortalClient } from '@/modules/projects/components/ClientPortalClient';

export const dynamic = 'force-dynamic';

interface ClientPortalPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ClientPortalPage({ params }: ClientPortalPageProps) {
  const { projectId } = await params;
  const session = await getServerSession(authOptions);

  const clientEmail = session?.user?.email || 'demo.client@lawrenceapp.internal';

  try {
    const projectData = await getClientPortalProjectData(projectId, clientEmail);
    return <ClientPortalClient projectData={projectData} />;
  } catch (error: any) {
    // If demo mode or previewing as admin, fetch project for display with client filter
    const project = await db.digitalProject.findUnique({
      where: { id: projectId },
      include: {
        client: true,
        service: true,
        milestones: { orderBy: { sequence: 'asc' } },
        deliverables: { include: { evidence: true } },
        activities: { where: { visibility: 'CLIENT_VISIBLE' }, take: 20 },
      },
    });

    return <ClientPortalClient projectData={project} />;
  }
}

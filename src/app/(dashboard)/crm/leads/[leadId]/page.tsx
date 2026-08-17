import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getLeadTimeline } from '@/modules/crm/service';
import { calculateLeadScore } from '@/modules/crm/scoring';
import { LeadCockpitClient } from '@/modules/crm/components/LeadCockpitClient';

export default async function LeadCockpitPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login');
  }

  const { leadId } = await params;

  const lead = await db.crmLead.findUnique({
    where: { id: leadId },
    include: {
      opportunities: true,
      followUps: true,
      appointments: true,
      interactions: true,
      notes: true,
    },
  });

  if (!lead) {
    notFound();
  }

  const timeline = await getLeadTimeline(leadId);
  const scoreResult = calculateLeadScore(lead);

  return (
    <LeadCockpitClient
      lead={{
        ...lead,
        createdAt: lead.createdAt.toISOString(),
      }}
      timeline={timeline}
      scoreFactors={scoreResult.factors}
    />
  );
}

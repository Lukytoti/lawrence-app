import React from 'react';
import AccessReviewClient from '@/modules/governance/components/AccessReviewClient';
import { db } from '@/lib/db';

export const metadata = {
  title: 'Access Governance Reviews | Lawrence Operating System',
  description: 'RBAC permission review & privilege audit.',
};

export default async function AccessReviewPage() {
  const reviews = await db.accessReview.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return <AccessReviewClient reviews={reviews} />;
}

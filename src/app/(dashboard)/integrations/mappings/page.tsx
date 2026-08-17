import React from 'react';
import MappingListClient from '@/modules/integrations/components/MappingListClient';
import { db } from '@/lib/db';

export const metadata = {
  title: 'Field Mappings | Lawrence Operating System',
  description: 'Payload field transformation and renaming rules.',
};

export default async function MappingsPage() {
  const mappings = await db.integrationMapping.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return <MappingListClient mappings={mappings} />;
}

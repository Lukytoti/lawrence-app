import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getDigitalServices } from '@/modules/projects/service-catalog';
import { ServiceCatalogClient } from '@/modules/projects/components/ServiceCatalogClient';

export const dynamic = 'force-dynamic';

export default async function ServicesAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/login');
  }

  const services = await getDigitalServices(false);

  return <ServiceCatalogClient services={services} />;
}

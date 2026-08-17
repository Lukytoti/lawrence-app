import React from 'react';
import DependencyMapClient from '@/modules/resilience/components/DependencyMapClient';
import { db } from '@/lib/db';

export const metadata = {
  title: 'Service Dependency Topology | Lawrence Operating System',
  description: 'Service dependencies, criticalities, fallbacks and RTO/RPO targets.',
};

export default async function DependenciesPage() {
  const dependencies = await db.resilienceDependency.findMany({
    orderBy: { criticality: 'asc' },
  });

  return <DependencyMapClient dependencies={dependencies} />;
}

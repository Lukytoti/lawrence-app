import React from 'react';
import { db } from '@/lib/db';
import { GlobalSearchClient } from '@/modules/command-center/components/GlobalSearchClient';
import { SearchDomain } from '@/modules/command-center/types';

export const dynamic = 'force-dynamic';

interface SearchPageProps {
  searchParams: Promise<{ domain?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { domain } = await searchParams;
  const superAdmin = await db.user.findFirst({
    where: { email: 'oluwatobi@lawrenceapp.internal' },
  });
  const actorUserId = superAdmin?.id || 'system-admin';

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-black text-white tracking-tight">Global System Search</h1>
        <p className="text-xs text-slate-400 mt-1">
          Search across members, CRM leads, digital clients, projects, invoices, and productivity tasks.
        </p>
      </div>

      <GlobalSearchClient actorUserId={actorUserId} initialDomain={domain as SearchDomain} />
    </div>
  );
}

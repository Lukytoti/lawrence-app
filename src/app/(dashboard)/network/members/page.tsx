import React from 'react';
import { db } from '@/lib/db';
import { searchMembers } from '@/modules/org/service';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Users, ExternalLink, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function MembersDirectoryPage() {
  const members = await searchMembers('', 100);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PROSPECT':
        return 'info';
      case 'INACTIVE':
      case 'AT_RISK':
        return 'warning';
      case 'EXITED':
      case 'ARCHIVED':
        return 'wine';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-widest text-txt-muted uppercase">NETWORK DIRECTORY</span>
            <Badge variant="wine">{members.length} MEMBERS</Badge>
          </div>
          <h1 className="text-2xl font-extrabold text-txt-primary">Network Member Directory</h1>
        </div>
      </div>

      <div className="bg-bg-surface border border-border-subtle rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-border-subtle bg-bg-surface-elevated/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-wine-text" />
            <span className="text-sm font-semibold text-txt-primary">All Registered Network Members</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-txt-primary">
            <thead className="bg-bg-surface-elevated/60 text-txt-muted uppercase text-[10px] tracking-wider border-b border-border-subtle">
              <tr>
                <th className="px-4 py-3">Member Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Direct Sponsor</th>
                <th className="px-4 py-3 text-center">Direct / Total Org</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/40">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-bg-surface-elevated/30 transition">
                  <td className="px-4 py-3 font-mono text-wine-text font-bold">{m.memberCode}</td>
                  <td className="px-4 py-3 font-semibold text-txt-primary">{m.name}</td>
                  <td className="px-4 py-3 text-txt-muted font-mono">{m.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={getStatusVariant(m.status)}>{m.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-txt-muted">
                    {m.sponsor ? `${m.sponsor.name} (${m.sponsor.memberCode})` : 'Root Admin'}
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-medium">
                    {m.directDownlineCount} / <span className="text-wine-text">{m.totalDownlineCount}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/network/members/${m.id}`}>
                      <Button variant="secondary" size="sm" rightIcon={<ExternalLink className="w-3 h-3" />}>
                        View Profile
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

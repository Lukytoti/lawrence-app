import React from 'react';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
import { Badge } from '@/components/ui/Badge';
import { UserCog, ShieldCheck } from 'lucide-react';

export default async function AdminUsersPage() {
  const users = await db.user.findMany({
    include: {
      profile: true,
      userRoles: {
        include: {
          role: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-widest text-txt-muted uppercase">SYSTEM ADMINISTRATION</span>
            <Badge variant="wine">DYNAMIC RBAC</Badge>
          </div>
          <h1 className="text-2xl font-extrabold text-txt-primary">User Accounts & Roles</h1>
        </div>
      </div>

      <div className="bg-bg-surface border border-border-subtle rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-border-subtle bg-bg-surface-elevated/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCog className="w-4 h-4 text-wine-text" />
            <span className="text-sm font-semibold text-txt-primary">System Identity Accounts ({users.length})</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-txt-primary">
            <thead className="bg-bg-surface-elevated/60 text-txt-muted uppercase text-[10px] tracking-wider border-b border-border-subtle">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Assigned Roles</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/40">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-bg-surface-elevated/30 transition">
                  <td className="px-4 py-3 font-semibold text-txt-primary flex items-center gap-2">
                    {u.profile?.displayName || u.name || 'User'}
                    {u.userRoles.some((ur) => ur.role.name === 'SUPER_ADMIN') && (
                      <span title="Owner / Super Admin">
                        <ShieldCheck className="w-3.5 h-3.5 text-wine-text" />
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-txt-muted font-mono">{u.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.userRoles.map((ur) => (
                        <Badge key={ur.roleId} variant="wine">
                          {ur.role.name}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={u.status === 'ACTIVE' ? 'success' : 'warning'}>{u.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-txt-muted font-mono">
                    {new Date(u.createdAt).toLocaleDateString()}
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

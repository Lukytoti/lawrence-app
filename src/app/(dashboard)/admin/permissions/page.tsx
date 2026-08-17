import React from 'react';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
import { Badge } from '@/components/ui/Badge';
import { ShieldAlert, Key } from 'lucide-react';

export default async function AdminPermissionsPage() {
  const roles = await db.role.findMany({
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-widest text-txt-muted uppercase">SECURITY MATRIX</span>
            <Badge variant="wine">GRANULAR PERMISSIONS</Badge>
          </div>
          <h1 className="text-2xl font-extrabold text-txt-primary">Roles & Permission Matrix</h1>
        </div>
      </div>

      <div className="space-y-4">
        {roles.map((role) => (
          <div key={role.id} className="p-4 rounded-xl bg-bg-surface border border-border-subtle shadow-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-wine-text" />
                <h3 className="text-base font-bold text-txt-primary">{role.name}</h3>
                {role.isSystem && <Badge variant="outline">System Role</Badge>}
              </div>
              <span className="text-xs text-txt-muted font-mono">{role.permissions.length} Permissions</span>
            </div>
            <p className="text-xs text-txt-muted mb-3">{role.description}</p>
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border-subtle/50">
              {role.permissions.map((rp) => (
                <span
                  key={rp.permissionId}
                  className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700"
                >
                  <Key className="w-3 h-3 text-wine-text" />
                  {rp.permission.code}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

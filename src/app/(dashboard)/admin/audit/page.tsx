import React from 'react';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
import { Badge } from '@/components/ui/Badge';
import { ShieldAlert, Terminal } from 'lucide-react';

export default async function AuditLogPage() {
  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      actor: {
        include: {
          profile: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-widest text-txt-muted uppercase">SYSTEM SECURITY</span>
            <Badge variant="wine">IMMUTABLE LOGS</Badge>
          </div>
          <h1 className="text-2xl font-extrabold text-txt-primary">Security Audit Trail</h1>
        </div>
      </div>

      <div className="bg-bg-surface border border-border-subtle rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-border-subtle bg-bg-surface-elevated/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-wine-text" />
            <span className="text-sm font-semibold text-txt-primary">Audit Activity Log ({logs.length})</span>
          </div>
          <span className="text-xs text-txt-muted font-mono">Append-Only Standard</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-txt-primary">
            <thead className="bg-bg-surface-elevated/60 text-txt-muted uppercase text-[10px] tracking-wider border-b border-border-subtle">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/40">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-bg-surface-elevated/30 transition">
                  <td className="px-4 py-3 text-txt-muted font-mono whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="wine">{log.action}</Badge>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {log.actor?.profile?.displayName || log.actor?.email || log.actorId || 'SYSTEM'}
                  </td>
                  <td className="px-4 py-3 text-txt-muted">
                    {log.entityType} ({log.entityId || 'N/A'})
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-zinc-400 max-w-xs truncate">
                    {log.metadata || '-'}
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

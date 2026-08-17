import React from 'react';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
import { Badge } from '@/components/ui/Badge';
import { Settings, Sliders } from 'lucide-react';

export default async function SettingsPage() {
  const settings = await db.systemSetting.findMany({
    orderBy: { key: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-widest text-txt-muted uppercase">SYSTEM ADMINISTRATION</span>
            <Badge variant="outline">ENVIRONMENT CONFIG</Badge>
          </div>
          <h1 className="text-2xl font-extrabold text-txt-primary">System Settings</h1>
        </div>
      </div>

      <div className="bg-bg-surface border border-border-subtle rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-border-subtle bg-bg-surface-elevated/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-wine-text" />
            <span className="text-sm font-semibold text-txt-primary">Configuration Parameters ({settings.length})</span>
          </div>
        </div>

        <div className="divide-y divide-border-subtle/40 p-4 space-y-4">
          {settings.map((item) => (
            <div key={item.id} className="pt-3 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-wine-text">{item.key}</span>
                  {item.isPublic && <Badge variant="info">Public</Badge>}
                </div>
                <p className="text-xs text-txt-muted mt-0.5">{item.description}</p>
              </div>
              <div className="font-mono text-xs text-txt-primary bg-bg-surface-elevated px-3 py-1.5 rounded border border-border-subtle">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

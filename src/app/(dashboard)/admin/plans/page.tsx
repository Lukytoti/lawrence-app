import React from 'react';
import { db } from '@/lib/db';
import { getActivePlanVersion } from '@/modules/ranks/service';
import { Badge } from '@/components/ui/Badge';
import { Award, Shield, FileText, CheckCircle2, DollarSign, Layers } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminPlansPage() {
  const activeVersion = await getActivePlanVersion('NG');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-widest text-txt-muted uppercase">COMPENSATION PLAN MANAGER</span>
            <Badge variant="success">ACTIVE PLAN VERSION: {activeVersion.versionName}</Badge>
          </div>
          <h1 className="text-2xl font-extrabold text-txt-primary">Compensation Plans & Rank Requirements</h1>
        </div>
      </div>

      {/* Plan Active Header Banner */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-bg-surface via-wine-deep/40 to-bg-surface border border-border-strong shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-txt-muted font-mono uppercase">Country: {activeVersion.plan.country} • Version {activeVersion.versionName}</div>
          <h2 className="text-xl font-bold text-white mt-1">{activeVersion.plan.name}</h2>
          <p className="text-xs text-txt-muted mt-1 max-w-xl">{activeVersion.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="wine">{activeVersion.ranks.length} RANKS CONFIGURABLE</Badge>
          <Badge variant="outline">EFFECTIVE FROM {new Date(activeVersion.effectiveFrom).toLocaleDateString()}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ranks & Requirements Registry */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold text-txt-muted uppercase tracking-wider">
            Configured Ranks & Qualification Rules
          </h3>
          <div className="space-y-3">
            {activeVersion.ranks.map((r) => (
              <div key={r.id} className="p-4 rounded-xl bg-bg-surface border border-border-subtle space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-wine-primary/40 text-amber-300 text-xs font-bold flex items-center justify-center">
                      L{r.level}
                    </span>
                    <span className="font-bold text-txt-primary text-sm">{r.displayName}</span>
                    <span className="text-[10px] font-mono text-wine-text">({r.code})</span>
                  </div>
                  <Badge variant={r.category === 'DIRECTOR_FAMILY' ? 'wine' : 'default'}>{r.category}</Badge>
                </div>

                {r.requirements.length > 0 ? (
                  <div className="pt-2 border-t border-border-subtle/50 space-y-1">
                    <div className="text-[11px] text-txt-muted font-semibold">Configured Requirements:</div>
                    {r.requirements.map((req) => (
                      <div key={req.id} className="text-xs text-zinc-300 flex items-center gap-2 pl-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{req.description}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-txt-muted italic pt-1">
                    No requirement configured (Base rank / Higher rank placeholder).
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* SVB Rate Table Config */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-txt-muted uppercase tracking-wider">
            SVB Rate Configuration Table
          </h3>
          <div className="p-4 rounded-xl bg-bg-surface border border-border-subtle space-y-3 shadow-sm">
            <p className="text-xs text-txt-muted">
              Sales Volume Bonus (SVB) rate percentage resolved by QPV thresholds under active plan version.
            </p>
            <div className="divide-y divide-border-subtle/40">
              {activeVersion.svbRates.map((svb) => (
                <div key={svb.id} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="font-mono text-txt-primary">
                    {Number(svb.minQPV).toLocaleString()} {svb.maxQPV ? `- ${Number(svb.maxQPV).toLocaleString()} QPV` : '+ QPV'}
                  </span>
                  <Badge variant="wine">{Number(svb.ratePercent)}% SVB</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

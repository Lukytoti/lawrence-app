'use client';

import React from 'react';
import Link from 'next/link';

interface Props {
  execution: any;
}

export default function BackupDetailClient({ execution }: Props) {
  if (!execution) {
    return (
      <div className="p-6 bg-[#09090B] text-slate-100 min-h-screen">
        <p className="text-sm text-slate-400">Backup execution not found.</p>
        <Link href="/resilience/backups" className="text-xs text-rose-400 hover:underline mt-2 inline-block">
          ← Back to Backups
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#09090B] text-slate-100 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>🔍</span> Backup Inspection: {execution.executionCode}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Execution checksum, storage verification status, and detailed integrity metadata.
          </p>
        </div>
        <Link
          href="/resilience/backups"
          className="px-4 py-2 text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition border border-white/10"
        >
          ← Back to Backups
        </Link>
      </div>

      {/* Detail Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Core Info */}
        <div className="p-5 bg-[#111113] border border-white/10 rounded-xl space-y-3">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Execution Summary</h2>
          <div className="text-xs space-y-2 text-slate-300">
            <div>Status: <span className="font-semibold text-emerald-400">{execution.status}</span></div>
            <div>Verification: <span className="font-semibold text-amber-400">{execution.verificationStatus}</span></div>
            <div>Correlation ID: <span className="font-mono text-slate-400">{execution.correlationId || '-'}</span></div>
            <div>Started: <span className="text-slate-400">{new Date(execution.startedAt).toLocaleString()}</span></div>
            <div>Completed: <span className="text-slate-400">{execution.completedAt ? new Date(execution.completedAt).toLocaleString() : 'In Progress'}</span></div>
          </div>
        </div>

        {/* Plan Info */}
        <div className="p-5 bg-[#111113] border border-white/10 rounded-xl space-y-3">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Associated Backup Plan</h2>
          <div className="text-xs space-y-2 text-slate-300">
            <div>Plan Code: <span className="font-mono text-slate-200">{execution.backupPlan?.planCode}</span></div>
            <div>Plan Name: <span className="text-white font-medium">{execution.backupPlan?.name}</span></div>
            <div>Type: <span className="text-sky-400 font-semibold">{execution.backupPlan?.backupType}</span></div>
            <div>Frequency: <span className="text-slate-400">{execution.backupPlan?.frequency}</span></div>
            <div>Retention: <span className="text-slate-400">{execution.backupPlan?.retentionDays} days</span></div>
          </div>
        </div>

        {/* Integrity Info */}
        <div className="p-5 bg-[#111113] border border-white/10 rounded-xl space-y-3">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Integrity & Checksum</h2>
          <div className="text-xs space-y-2 text-slate-300">
            <div>SHA-256 Checksum:</div>
            <div className="p-2 bg-black/40 rounded font-mono text-[10px] text-slate-300 break-all border border-white/5">
              {execution.checksum || 'Pending calculation...'}
            </div>
            <div>Storage Reference: <span className="text-slate-400 font-mono text-[11px]">{execution.storageReference || 'Default Vault'}</span></div>
            <div>Size: <span className="text-slate-400">{execution.sizeBytes ? `${execution.sizeBytes} bytes` : '-'}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

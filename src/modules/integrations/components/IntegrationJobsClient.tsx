'use client';

import React from 'react';

interface Props {
  jobs: any[];
}

export default function IntegrationJobsClient({ jobs }: Props) {
  return (
    <div className="p-6 bg-[#09090B] text-slate-100 min-h-screen space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span>⏱️</span> Synchronization Jobs & Retry Engine
        </h1>
        <p className="text-xs text-slate-400 mt-1">Scheduled background jobs, attempt tracking & exponential backoff retry schedules.</p>
      </div>

      <div className="bg-[#111113] border border-white/10 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">Sync Jobs ({jobs.length})</h2>
        {jobs.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">No integration jobs scheduled.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {jobs.map((j) => (
              <div key={j.id} className="py-4 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono text-teal-400 font-bold mr-2">{j.jobCode}</span>
                  <span className="font-semibold text-white mr-2">[{j.jobType}]</span>
                  <span className="text-slate-400">Attempts: {j.attemptCount}/{j.maxAttempts}</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold">{j.status}</span>
                  <span className="text-slate-500">{new Date(j.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React from 'react';

interface Props {
  deadEvents: any[];
  deadJobs: any[];
}

export default function DeadLetterClient({ deadEvents, deadJobs }: Props) {
  return (
    <div className="p-6 bg-[#09090B] text-slate-100 min-h-screen space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span>☠️</span> Dead-Letter Queue (DLQ) Management
        </h1>
        <p className="text-xs text-slate-400 mt-1">Inspect, retry with preserved idempotency, or discard failed integration events & jobs.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-[#111113] border border-white/10 rounded-xl">
          <div className="text-xs text-slate-400">Dead-Letter Events</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{deadEvents.length}</div>
        </div>
        <div className="p-4 bg-[#111113] border border-white/10 rounded-xl">
          <div className="text-xs text-slate-400">Dead-Letter Jobs</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{deadJobs.length}</div>
        </div>
      </div>

      <div className="bg-[#111113] border border-white/10 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">DLQ Event Feed</h2>
        {deadEvents.length === 0 && deadJobs.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">Zero events or jobs in dead-letter status.</p>
        ) : (
          <div className="divide-y divide-white/5 font-mono text-xs">
            {deadEvents.map((evt) => (
              <div key={evt.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="text-rose-400 font-bold mr-2">{evt.eventCode}</span>
                  <span className="text-slate-300 mr-2">[{evt.eventType}]</span>
                  <span className="text-slate-400 text-[11px]">{evt.error || 'Max retries exceeded'}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px]">
                  DEAD_LETTER
                </span>
              </div>
            ))}
            {deadJobs.map((job) => (
              <div key={job.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="text-rose-400 font-bold mr-2">{job.jobCode}</span>
                  <span className="text-slate-300 mr-2">[{job.jobType}]</span>
                  <span className="text-slate-400 text-[11px]">{job.error || 'Max retries exceeded'}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px]">
                  DEAD_LETTER
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

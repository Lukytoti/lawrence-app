'use client';

import React from 'react';

interface Props {
  execution: any;
}

export function ExecutionDetailClient({ execution }: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 border border-white/10 p-6 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Execution Timeline: {execution.workflow?.name}
          </h1>
          <p className="text-sm text-zinc-400 mt-1 font-mono">
            Idempotency Key: {execution.idempotencyKey}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded text-xs font-semibold uppercase font-mono ${
            execution.status === 'COMPLETED'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/20 text-rose-400 border border-rose-500/20'
          }`}
        >
          {execution.status}
        </span>
      </div>

      <div className="bg-zinc-900 border border-white/10 p-6 rounded-lg space-y-6">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Step Execution Results</h3>

        <div className="space-y-4">
          {execution.stepExecutions?.map((stepExec: any) => (
            <div key={stepExec.id} className="p-4 bg-zinc-950 rounded border border-white/5 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-white">
                  Step {stepExec.sequence}: {stepExec.step?.type}
                </span>
                <span className="font-mono text-zinc-400">{stepExec.status}</span>
              </div>
              {stepExec.outputJson && (
                <pre className="p-2 bg-zinc-900 rounded text-xs font-mono text-zinc-300 overflow-x-auto">
                  {stepExec.outputJson}
                </pre>
              )}
              {stepExec.error && (
                <div className="text-xs text-rose-400 font-mono">Error: {stepExec.error}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

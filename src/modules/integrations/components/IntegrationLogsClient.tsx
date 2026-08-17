'use client';

import React from 'react';

interface Props {
  logs: any[];
}

export default function IntegrationLogsClient({ logs }: Props) {
  return (
    <div className="p-6 bg-[#09090B] text-slate-100 min-h-screen space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span>📜</span> Gateway Execution Logs & Audit Trail
        </h1>
        <p className="text-xs text-slate-400 mt-1">Sanitized gateway execution logs, correlation IDs, status codes & durations.</p>
      </div>

      <div className="bg-[#111113] border border-white/10 rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-white">Execution Feed ({logs.length})</h2>
        {logs.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">No logs recorded.</p>
        ) : (
          <div className="divide-y divide-white/5 font-mono text-xs">
            {logs.map((log) => (
              <div key={log.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    log.level === 'ERROR' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {log.level}
                  </span>
                  <span className="text-slate-200">{log.message}</span>
                </div>
                <div className="flex items-center gap-4 text-slate-500 text-[11px]">
                  <span>Status: {log.statusCode || 'N/A'}</span>
                  <span>Duration: {log.durationMs || 0}ms</span>
                  <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

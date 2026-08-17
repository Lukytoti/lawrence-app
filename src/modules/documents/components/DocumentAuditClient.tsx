'use client';

import React from 'react';
import { History, Shield, Activity, FileText } from 'lucide-react';
import Link from 'next/link';

interface DocumentAuditProps {
  logs: any[];
}

export default function DocumentAuditClient({ logs }: DocumentAuditProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111113] border border-white/10 rounded-xl p-6">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
            <History className="w-6 h-6 text-red-500" />
            Document Activity & Audit Trail
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Immutable, sanitized ledger of all document creations, downloads, shares, approvals, and legal hold events.
          </p>
        </div>
      </div>

      <div className="bg-[#111113] border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-[#18181B] text-xs uppercase font-semibold text-gray-400 border-b border-white/10">
            <tr>
              <th className="px-5 py-3">Timestamp</th>
              <th className="px-5 py-3">Activity Type</th>
              <th className="px-5 py-3">Actor</th>
              <th className="px-5 py-3">Document</th>
              <th className="px-5 py-3">Message</th>
              <th className="px-5 py-3 text-right">Correlation ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-gray-500">
                  No document activity logs recorded yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition">
                  <td className="px-5 py-3.5 text-xs text-gray-400 font-mono">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-white/5 text-red-400">
                      {log.activityType}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-300">{log.actor?.name || 'System'}</td>
                  <td className="px-5 py-3.5 font-medium text-white text-xs">
                    {log.documentId ? (
                      <Link href={`/documents/${log.documentId}`} className="hover:text-red-400">
                        {log.document?.title || log.documentId}
                      </Link>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-300">{log.message}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-500 font-mono text-right">
                    {log.correlationId || 'N/A'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

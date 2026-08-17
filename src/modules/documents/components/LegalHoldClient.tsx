'use client';

import React from 'react';
import { Shield, Lock, Unlock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface LegalHoldProps {
  holds: any[];
}

export default function LegalHoldClient({ holds }: LegalHoldProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111113] border border-white/10 rounded-xl p-6">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
            <Shield className="w-6 h-6 text-purple-400" />
            Legal Preservation Holds & Audit Locks
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Active preservation holds prevent accidental or automated deletion of sensitive records.
          </p>
        </div>
      </div>

      <div className="bg-[#111113] border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-[#18181B] text-xs uppercase font-semibold text-gray-400 border-b border-white/10">
            <tr>
              <th className="px-5 py-3">Hold Code</th>
              <th className="px-5 py-3">Document</th>
              <th className="px-5 py-3">Preservation Reason</th>
              <th className="px-5 py-3">Placed By</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Date Placed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {holds.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-gray-500">
                  No legal preservation holds currently active.
                </td>
              </tr>
            ) : (
              holds.map((h) => (
                <tr key={h.id} className="hover:bg-white/[0.02] transition">
                  <td className="px-5 py-3.5 font-mono text-xs text-white">{h.holdCode}</td>
                  <td className="px-5 py-3.5 font-medium text-white">
                    <Link href={`/documents/${h.documentId}`} className="hover:text-purple-400">
                      {h.document?.title || h.documentId}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-300">{h.reason}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">{h.placedBy?.name || 'Compliance Officer'}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        h.status === 'ACTIVE' ? 'bg-red-500/20 text-red-300' : 'bg-gray-500/20 text-gray-300'
                      }`}
                    >
                      {h.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-400 text-right">
                    {new Date(h.placedAt).toLocaleDateString()}
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

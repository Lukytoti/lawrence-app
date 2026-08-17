'use client';

import React from 'react';
import { FileCheck, Shield, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface RetentionRecordsProps {
  policies: any[];
  dueDocuments: any[];
}

export default function RetentionRecordsClient({ policies, dueDocuments }: RetentionRecordsProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111113] border border-white/10 rounded-xl p-6">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
            <FileCheck className="w-6 h-6 text-emerald-500" />
            Record Retention & Compliance Lifecycle
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Automated document archiving, expiration evaluation, and legal-hold protected preservation rules.
          </p>
        </div>
      </div>

      {/* Policies Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {policies.map((p) => (
          <div key={p.id} className="bg-[#111113] border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-emerald-400">{p.documentType}</span>
              <span className="text-xs text-gray-400 font-medium">{p.retentionDays} Days</span>
            </div>
            <h3 className="font-bold text-white text-base mb-1">{p.name}</h3>
            <p className="text-xs text-gray-400">{p.description || 'Standard retention policy'}</p>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5 text-xs text-gray-400">
              <span>Auto-Archive: {p.autoArchive ? 'Yes' : 'No'}</span>
              <span>•</span>
              <span>Auto-Delete: {p.autoDelete ? 'Yes' : 'No'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Due Documents for Lifecycle Actions */}
      <div className="bg-[#111113] border border-white/10 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-white/10">
          <h2 className="text-base font-semibold text-white">Retention-Due Documents</h2>
        </div>
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-[#18181B] text-xs uppercase font-semibold text-gray-400 border-b border-white/10">
            <tr>
              <th className="px-5 py-3">Document Title</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Age (Days)</th>
              <th className="px-5 py-3">Policy Match</th>
              <th className="px-5 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {dueDocuments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-gray-500">
                  No documents currently due for retention actions. All records are compliant.
                </td>
              </tr>
            ) : (
              dueDocuments.map((item, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition">
                  <td className="px-5 py-3.5 font-medium text-white">
                    <Link href={`/documents/${item.document.id}`} className="hover:text-emerald-400">
                      {item.document.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-400">{item.document.documentType}</td>
                  <td className="px-5 py-3.5 text-xs text-amber-400 font-semibold">{item.ageDays} Days</td>
                  <td className="px-5 py-3.5 text-xs text-gray-300">{item.policy.name}</td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-300">
                      Due for Archival
                    </span>
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

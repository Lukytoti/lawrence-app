'use client';

import React, { useState } from 'react';
import { Shield, Plus, Trash2, User, Key } from 'lucide-react';
import Link from 'next/link';

interface DocumentPermissionProps {
  document: any;
  permissions: any[];
  currentUserId: string;
}

export default function DocumentPermissionClient({
  document: doc,
  permissions: initialPerms,
  currentUserId,
}: DocumentPermissionProps) {
  const [permissions, setPermissions] = useState(initialPerms);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111113] border border-white/10 rounded-xl p-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <Link href={`/documents/${doc.id}`} className="hover:text-white">
              {doc.title}
            </Link>
            <span>/</span>
            <span className="text-gray-200 font-mono">{doc.documentCode}</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-red-500" />
            Document Permissions & Access Controls
          </h1>
        </div>
      </div>

      <div className="bg-[#111113] border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-[#18181B] text-xs uppercase font-semibold text-gray-400 border-b border-white/10">
            <tr>
              <th className="px-5 py-3">Subject Type</th>
              <th className="px-5 py-3">Subject ID</th>
              <th className="px-5 py-3">Permission</th>
              <th className="px-5 py-3">Granted By</th>
              <th className="px-5 py-3">Expires</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {permissions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-gray-500">
                  No explicit ACL permissions assigned. Document follows inherited visibility.
                </td>
              </tr>
            ) : (
              permissions.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.02] transition">
                  <td className="px-5 py-3.5 font-medium text-white">{p.subjectType}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-400">{p.subjectId}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-white/5 text-red-400 border border-red-500/20">
                      {p.permission}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">{p.grantedBy?.name || 'Admin'}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">
                    {p.expiresAt ? new Date(p.expiresAt).toLocaleDateString() : 'Never'}
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

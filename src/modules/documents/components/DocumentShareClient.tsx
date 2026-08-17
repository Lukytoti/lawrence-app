'use client';

import React, { useState } from 'react';
import { Share2, Plus, Copy, Check, Trash2, Clock, Shield } from 'lucide-react';
import Link from 'next/link';
import { shareDocumentAction, revokeShareAction } from '../actions';

interface DocumentShareProps {
  document: any;
  shares: any[];
  currentUserId: string;
}

export default function DocumentShareClient({
  document: doc,
  shares: initialShares,
  currentUserId,
}: DocumentShareProps) {
  const [shares, setShares] = useState(initialShares);
  const [sharedWithId, setSharedWithId] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreateShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const newShare = await shareDocumentAction(
        {
          documentId: doc.id,
          sharedWithId: sharedWithId || undefined,
          sharedWithType: sharedWithId ? 'USER' : 'ORGANIZATION',
          permission: 'VIEW',
          expiresInDays,
        },
        currentUserId
      );

      setShares([newShare, ...shares]);
      setSharedWithId('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create share link');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (shareId: string) => {
    setIsSubmitting(true);
    try {
      await revokeShareAction(shareId, currentUserId);
      setShares(shares.filter((s) => s.id !== shareId));
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to revoke share');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

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
            <Share2 className="w-6 h-6 text-red-500" />
            Share Links & Revocable Delegations
          </h1>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-3 rounded-lg text-xs">
          {errorMsg}
        </div>
      )}

      {/* Share Generator Form */}
      <div className="bg-[#111113] border border-white/10 rounded-xl p-6">
        <h2 className="text-base font-semibold text-white mb-3">Generate Time-Bounded Share Token</h2>
        <form onSubmit={handleCreateShare} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
              Target User ID (Optional)
            </label>
            <input
              type="text"
              placeholder="Leave blank for link share"
              value={sharedWithId}
              onChange={(e) => setSharedWithId(e.target.value)}
              className="w-full bg-[#18181B] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-red-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
              Expiration (Days)
            </label>
            <select
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(Number(e.target.value))}
              className="w-full bg-[#18181B] border border-white/10 rounded-lg p-2.5 text-sm text-gray-300 focus:outline-none focus:border-red-500"
            >
              <option value={1}>1 Day</option>
              <option value={7}>7 Days</option>
              <option value={30}>30 Days</option>
              <option value={90}>90 Days</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-2.5 bg-red-700 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              Generate Share
            </button>
          </div>
        </form>
      </div>

      {/* Active Shares List */}
      <div className="bg-[#111113] border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-[#18181B] text-xs uppercase font-semibold text-gray-400 border-b border-white/10">
            <tr>
              <th className="px-5 py-3">Share Code</th>
              <th className="px-5 py-3">Shared With</th>
              <th className="px-5 py-3">Permission</th>
              <th className="px-5 py-3">Expires</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {shares.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-gray-500">
                  No active share tokens for this document.
                </td>
              </tr>
            ) : (
              shares.map((s) => (
                <tr key={s.id} className="hover:bg-white/[0.02] transition">
                  <td className="px-5 py-3.5 font-mono text-xs text-white">
                    <div className="flex items-center gap-2">
                      <span>{s.shareCode}</span>
                      <button
                        onClick={() => handleCopy(s.shareCode)}
                        className="text-gray-400 hover:text-white p-1"
                        title="Copy Share Code"
                      >
                        {copiedCode === s.shareCode ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">{s.sharedWithId || 'Any Authenticated User'}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-300">{s.permission}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">
                    {s.expiresAt ? new Date(s.expiresAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => handleRevoke(s.id)}
                      className="text-xs text-red-400 hover:text-red-300 font-medium"
                    >
                      Revoke
                    </button>
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

'use client';

import React, { useState } from 'react';
import {
  FileText,
  Clock,
  Shield,
  Share2,
  CheckCircle2,
  XCircle,
  Archive,
  Download,
  Plus,
  History,
  Lock,
  Tag,
  Folder
} from 'lucide-react';
import Link from 'next/link';
import {
  archiveDocumentAction,
  restoreDocumentAction,
  deleteDocumentAction,
  placeLegalHoldAction,
  releaseLegalHoldAction,
  requestApprovalAction,
} from '../actions';

interface DocumentViewerProps {
  document: any;
  currentUserId: string;
}

export default function DocumentViewerClient({ document: initialDoc, currentUserId }: DocumentViewerProps) {
  const [doc, setDoc] = useState(initialDoc);
  const [activeTab, setActiveTab] = useState<'details' | 'versions' | 'approvals' | 'shares' | 'history'>('details');
  const [isProcessing, setIsProcessing] = useState(false);
  const [holdReason, setHoldReason] = useState('');
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleArchive = async () => {
    setIsProcessing(true);
    setErrorMsg('');
    try {
      if (doc.isArchived) {
        const updated = await restoreDocumentAction(doc.id, currentUserId);
        setDoc({ ...doc, isArchived: false, status: 'ACTIVE' });
      } else {
        const updated = await archiveDocumentAction(doc.id, currentUserId);
        setDoc({ ...doc, isArchived: true, status: 'ARCHIVED' });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Action failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlaceHold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holdReason) return;
    setIsProcessing(true);
    setErrorMsg('');
    try {
      const hold = await placeLegalHoldAction({ documentId: doc.id, reason: holdReason }, currentUserId);
      setDoc({
        ...doc,
        legalHolds: [...(doc.legalHolds || []), hold],
      });
      setShowHoldModal(false);
      setHoldReason('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to place legal hold');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReleaseHold = async (holdId: string) => {
    setIsProcessing(true);
    setErrorMsg('');
    try {
      await releaseLegalHoldAction(holdId, currentUserId);
      setDoc({
        ...doc,
        legalHolds: (doc.legalHolds || []).filter((h: any) => h.id !== holdId),
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to release legal hold');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111113] border border-white/10 rounded-xl p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <FileText className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-white">{doc.title}</h1>
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                    doc.classification === 'RESTRICTED'
                      ? 'bg-red-500/20 text-red-300'
                      : doc.classification === 'CONFIDENTIAL'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-blue-500/20 text-blue-300'
                  }`}
                >
                  {doc.classification}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                    doc.status === 'APPROVED'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : doc.status === 'UNDER_REVIEW'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-gray-500/20 text-gray-300'
                  }`}
                >
                  {doc.status}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-1">
                Code: {doc.documentCode} | Type: {doc.documentType} | Created:{' '}
                {new Date(doc.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHoldModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#18181B] hover:bg-[#222226] text-amber-400 border border-amber-500/30 rounded-lg text-xs font-medium transition"
            >
              <Shield className="w-3.5 h-3.5" />
              Legal Hold
            </button>
            <button
              onClick={handleArchive}
              disabled={isProcessing}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#18181B] hover:bg-[#222226] text-gray-300 border border-white/10 rounded-lg text-xs font-medium transition"
            >
              <Archive className="w-3.5 h-3.5" />
              {doc.isArchived ? 'Restore' : 'Archive'}
            </button>
            <Link
              href={`/documents/${doc.id}/versions`}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition"
            >
              <Plus className="w-3.5 h-3.5" />
              New Version
            </Link>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 bg-red-500/20 border border-red-500/30 text-red-300 p-3 rounded-lg text-xs">
            {errorMsg}
          </div>
        )}

        {/* Legal Holds Alert Banner */}
        {doc.legalHolds && doc.legalHolds.length > 0 && (
          <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-400 text-xs font-medium">
              <Lock className="w-4 h-4" />
              <span>
                ACTIVE LEGAL HOLD: {doc.legalHolds[0].reason} ({doc.legalHolds[0].holdCode})
              </span>
            </div>
            <button
              onClick={() => handleReleaseHold(doc.legalHolds[0].id)}
              className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 px-2.5 py-1 rounded transition"
            >
              Release Hold
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10 flex gap-6">
        <button
          onClick={() => setActiveTab('details')}
          className={`pb-3 text-sm font-medium transition relative ${
            activeTab === 'details' ? 'text-red-400 border-b-2 border-red-500' : 'text-gray-400 hover:text-white'
          }`}
        >
          Overview & Metadata
        </button>
        <button
          onClick={() => setActiveTab('versions')}
          className={`pb-3 text-sm font-medium transition relative ${
            activeTab === 'versions' ? 'text-red-400 border-b-2 border-red-500' : 'text-gray-400 hover:text-white'
          }`}
        >
          Versions ({doc.versions?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('approvals')}
          className={`pb-3 text-sm font-medium transition relative ${
            activeTab === 'approvals' ? 'text-red-400 border-b-2 border-red-500' : 'text-gray-400 hover:text-white'
          }`}
        >
          Approvals ({doc.approvals?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('shares')}
          className={`pb-3 text-sm font-medium transition relative ${
            activeTab === 'shares' ? 'text-red-400 border-b-2 border-red-500' : 'text-gray-400 hover:text-white'
          }`}
        >
          Active Shares ({doc.shares?.length || 0})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-[#111113] border border-white/10 rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-white">Document Information</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 text-xs block">Description</span>
                <p className="text-white mt-1">{doc.description || 'No description provided.'}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs block">Storage Reference</span>
                <p className="text-gray-300 font-mono text-xs mt-1">{doc.storageReference}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs block">Checksum (SHA-256)</span>
                <p className="text-gray-300 font-mono text-xs mt-1">{doc.checksum || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs block">File Size</span>
                <p className="text-white mt-1">
                  {doc.fileSizeBytes ? `${Math.round(doc.fileSizeBytes / 1024)} KB` : 'N/A'}
                </p>
              </div>
            </div>

            {doc.tags && doc.tags.length > 0 && (
              <div>
                <span className="text-gray-500 text-xs block mb-2">Assigned Tags</span>
                <div className="flex flex-wrap gap-2">
                  {doc.tags.map((t: any) => (
                    <span key={t.id} className="px-2.5 py-1 bg-white/5 text-gray-300 rounded text-xs">
                      #{t.tag?.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-[#111113] border border-white/10 rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-white">Security & Governance</h2>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-gray-400">Owner</span>
                <span className="text-white">{doc.owner?.name || 'System'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-gray-400">Visibility</span>
                <span className="text-white">{doc.visibility}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-gray-400">Classification</span>
                <span className="text-white">{doc.classification}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-gray-400">Archived</span>
                <span className="text-white">{doc.isArchived ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'versions' && (
        <div className="bg-[#111113] border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-[#18181B] text-xs uppercase font-semibold text-gray-400 border-b border-white/10">
              <tr>
                <th className="px-5 py-3">Version</th>
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Change Summary</th>
                <th className="px-5 py-3">Checksum</th>
                <th className="px-5 py-3">Size</th>
                <th className="px-5 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(doc.versions || []).map((ver: any) => (
                <tr key={ver.id} className="hover:bg-white/[0.02] transition">
                  <td className="px-5 py-3.5 font-bold text-white">v{ver.versionNumber}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-400">{ver.versionCode}</td>
                  <td className="px-5 py-3.5 text-gray-300">{ver.changeSummary || 'No summary'}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-500 truncate max-w-xs">
                    {ver.checksum}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">
                    {ver.fileSizeBytes ? `${Math.round(ver.fileSizeBytes / 1024)} KB` : 'N/A'}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">
                    {new Date(ver.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legal Hold Modal */}
      {showHoldModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181B] border border-white/10 rounded-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-500" />
              Place Legal Preservation Hold
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              Documents under legal hold cannot be deleted or pruned by automated retention policies until released.
            </p>
            <form onSubmit={handlePlaceHold} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                  Reason for Hold *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Preserved for ongoing regulatory audit Q3..."
                  value={holdReason}
                  onChange={(e) => setHoldReason(e.target.value)}
                  className="w-full bg-[#111113] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowHoldModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  Place Hold
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

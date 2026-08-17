'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, Clock, Check, FileText } from 'lucide-react';
import Link from 'next/link';
import {
  requestApprovalAction,
  approveDocumentAction,
  rejectDocumentAction,
} from '../actions';

interface DocumentApprovalProps {
  document: any;
  approvals: any[];
  currentUserId: string;
}

export default function DocumentApprovalClient({
  document: doc,
  approvals: initialApprovals,
  currentUserId,
}: DocumentApprovalProps) {
  const [approvals, setApprovals] = useState(initialApprovals);
  const [selectedVersionId, setSelectedVersionId] = useState(doc.versions?.[0]?.id || '');
  const [comments, setComments] = useState('');
  const [reviewerId, setReviewerId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRequestApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVersionId) return;
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const newApp = await requestApprovalAction(
        {
          documentId: doc.id,
          versionId: selectedVersionId,
          reviewerId: reviewerId || undefined,
          comments,
        },
        currentUserId
      );

      setApprovals([newApp, ...approvals]);
      setSuccessMsg('Approval request submitted successfully');
      setComments('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit approval request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (approvalId: string) => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const approved = await approveDocumentAction(approvalId, 'Approved via dashboard', currentUserId);
      setApprovals(approvals.map((a) => (a.id === approvalId ? { ...a, status: 'APPROVED' } : a)));
      setSuccessMsg('Document approved successfully');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to approve document');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (approvalId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await rejectDocumentAction(approvalId, reason, currentUserId);
      setApprovals(approvals.map((a) => (a.id === approvalId ? { ...a, status: 'REJECTED' } : a)));
      setSuccessMsg('Document rejected');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reject document');
    } finally {
      setIsSubmitting(false);
    }
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
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            Document Approval & Compliance Workflows
          </h1>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-3 rounded-lg text-xs">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 p-3 rounded-lg text-xs">
          {successMsg}
        </div>
      )}

      {/* Request Approval Form */}
      <div className="bg-[#111113] border border-white/10 rounded-xl p-6">
        <h2 className="text-base font-semibold text-white mb-3">Request Compliance Review</h2>
        <form onSubmit={handleRequestApproval} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                Target Version *
              </label>
              <select
                value={selectedVersionId}
                onChange={(e) => setSelectedVersionId(e.target.value)}
                className="w-full bg-[#18181B] border border-white/10 rounded-lg p-2.5 text-sm text-gray-300 focus:outline-none focus:border-red-500"
              >
                {(doc.versions || []).map((v: any) => (
                  <option key={v.id} value={v.id}>
                    Version {v.versionNumber} ({v.versionCode})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                Reviewer User ID (Optional)
              </label>
              <input
                type="text"
                placeholder="Leave blank for any authorized reviewer"
                value={reviewerId}
                onChange={(e) => setReviewerId(e.target.value)}
                className="w-full bg-[#18181B] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
              Review Instructions / Comments
            </label>
            <input
              type="text"
              placeholder="Please verify compliance with ISO / internal policies..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full bg-[#18181B] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-red-500"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            Submit for Review
          </button>
        </form>
      </div>

      {/* Approvals Table */}
      <div className="bg-[#111113] border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-[#18181B] text-xs uppercase font-semibold text-gray-400 border-b border-white/10">
            <tr>
              <th className="px-5 py-3">Approval Code</th>
              <th className="px-5 py-3">Version</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Requested By</th>
              <th className="px-5 py-3">Reviewed At</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {approvals.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-gray-500">
                  No approval requests submitted for this document.
                </td>
              </tr>
            ) : (
              approvals.map((a) => (
                <tr key={a.id} className="hover:bg-white/[0.02] transition">
                  <td className="px-5 py-3.5 font-mono text-xs text-white">{a.approvalCode}</td>
                  <td className="px-5 py-3.5 font-semibold text-white">v{a.version?.versionNumber || '1'}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        a.status === 'APPROVED'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : a.status === 'REJECTED'
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">{a.requestedBy?.name || 'User'}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">
                    {a.reviewedAt ? new Date(a.reviewedAt).toLocaleDateString() : 'Pending'}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {a.status === 'PENDING' && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(a.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(a.id)}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs transition"
                        >
                          Reject
                        </button>
                      </div>
                    )}
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

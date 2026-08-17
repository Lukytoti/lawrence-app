'use client';

import React, { useState } from 'react';
import { approvePayoutAction, rejectPayoutAction, postAdjustmentAction } from '../actions';
import { formatCurrencyAmount } from '../rules';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle, XCircle, Sliders, ShieldAlert, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export interface AdminTransactionsClientProps {
  pendingRequests: any[];
  recentLedger: any[];
}

export const AdminTransactionsClient: React.FC<AdminTransactionsClientProps> = ({ pendingRequests, recentLedger }) => {
  const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({});
  const [selectedEntryId, setSelectedEntryId] = useState<string>('');
  const [adjType, setAdjType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [adjAmount, setAdjAmount] = useState<number>(1000);
  const [adjReason, setAdjReason] = useState<string>('System correction');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleApprove = async (requestId: string) => {
    if (!confirm('Are you sure you want to approve and process this payout request? A DEBIT entry will be posted.')) return;
    setIsProcessing(true);
    try {
      await approvePayoutAction(requestId);
      alert('Payout request approved and DEBIT entry posted to ledger.');
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Approval failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (requestId: string) => {
    const reason = rejectionReason[requestId];
    if (!reason || reason.trim().length === 0) {
      alert('A valid rejection reason must be provided.');
      return;
    }

    setIsProcessing(true);
    try {
      await rejectPayoutAction(requestId, reason);
      alert('Payout request rejected with recorded reason.');
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Rejection failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntryId) {
      alert('Please enter or select a target ledger entry ID.');
      return;
    }

    setIsProcessing(true);
    try {
      await postAdjustmentAction(selectedEntryId, adjType, adjAmount, adjReason);
      alert('Offsetting adjustment entry successfully posted to ledger!');
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Adjustment posting failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Pending Payout Approvals Section */}
      <div className="p-6 rounded-2xl bg-bg-surface border border-border-subtle space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div>
            <h2 className="text-lg font-extrabold text-white uppercase">Pending Payout Requests Review</h2>
            <p className="text-xs text-txt-muted">Approve to process withdrawal DEBIT entry or reject with recorded reason</p>
          </div>
          <Badge variant="warning">{pendingRequests.length} Pending</Badge>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="p-6 text-center text-xs text-txt-muted">No pending payout requests requiring action.</div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((req) => {
              const details = JSON.parse(req.payoutDetailsJson || '{}');
              const memberName = req.account?.member?.user?.profile?.displayName || req.account?.member?.user?.name || req.memberId;

              return (
                <div key={req.id} className="p-4 rounded-xl bg-bg-surface-elevated/40 border border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-sm">{memberName}</span>
                      <Badge variant="wine">{req.account?.member?.memberCode}</Badge>
                    </div>
                    <div className="text-lg font-black text-amber-400 font-mono">
                      {formatCurrencyAmount(Number(req.amount), req.currency)}
                    </div>
                    <div className="text-[11px] text-txt-muted font-mono">
                      Bank: {details.bankName} | Acc: {details.accountNumber} ({details.accountName})
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      placeholder="Rejection reason..."
                      value={rejectionReason[req.id] || ''}
                      onChange={(e) => setRejectionReason({ ...rejectionReason, [req.id]: e.target.value })}
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white"
                    />
                    <button
                      onClick={() => handleReject(req.id)}
                      disabled={isProcessing}
                      className="px-3 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 border border-rose-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button
                      onClick={() => handleApprove(req.id)}
                      disabled={isProcessing}
                      className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition-all flex items-center justify-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve & Debit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Post Offsetting Financial Adjustment Section */}
      <div className="p-6 rounded-2xl bg-bg-surface border border-border-subtle space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
          <Sliders className="w-5 h-5 text-wine-text" />
          <h2 className="text-lg font-extrabold text-white uppercase">Post Offsetting Ledger Adjustment</h2>
        </div>

        <form onSubmit={handleAdjustmentSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block text-txt-muted mb-1 font-mono">Target Entry ID</label>
            <input
              type="text"
              placeholder="UUID of entry..."
              value={selectedEntryId}
              onChange={(e) => setSelectedEntryId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-txt-muted mb-1 font-mono">Adjustment Type</label>
            <select
              value={adjType}
              onChange={(e) => setAdjType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-mono"
            >
              <option value="CREDIT">CREDIT (+)</option>
              <option value="DEBIT">DEBIT (-)</option>
            </select>
          </div>

          <div>
            <label className="block text-txt-muted mb-1 font-mono">Amount</label>
            <input
              type="number"
              min="1"
              value={adjAmount}
              onChange={(e) => setAdjAmount(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-txt-muted mb-1 font-mono">Reason / Notes</label>
            <input
              type="text"
              value={adjReason}
              onChange={(e) => setAdjReason(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white"
              required
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-2 rounded-lg bg-wine-primary hover:bg-wine-accent text-white font-bold transition-all"
            >
              Post Adjustment Entry
            </button>
          </div>
        </form>
      </div>

      {/* Organization Ledger Audit Log Table */}
      <div className="p-6 rounded-2xl bg-bg-surface border border-border-subtle space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div>
            <h2 className="text-lg font-extrabold text-white uppercase">Organization Audit Ledger</h2>
            <p className="text-xs text-txt-muted">Recent posted transactions across organization</p>
          </div>
          <Badge variant="outline">Last 50 Entries</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border-subtle text-txt-muted uppercase tracking-wider text-[10px]">
                <th className="p-3">ID</th>
                <th className="p-3">Member</th>
                <th className="p-3">Domain</th>
                <th className="p-3">Category</th>
                <th className="p-3">Description</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/40">
              {recentLedger.map((item) => {
                const memberName = item.account?.member?.user?.profile?.displayName || item.account?.member?.user?.name || item.memberId;
                return (
                  <tr key={item.id} className="hover:bg-bg-surface-elevated/30 transition-all font-mono">
                    <td className="p-3 text-txt-muted text-[10px]">{item.id.slice(0, 8)}...</td>
                    <td className="p-3 font-bold text-white">{memberName}</td>
                    <td className="p-3">
                      <Badge variant="outline">{item.businessDomain}</Badge>
                    </td>
                    <td className="p-3 font-bold text-white">{item.category}</td>
                    <td className="p-3 text-txt-primary">{item.description}</td>
                    <td className={`p-3 text-right font-bold ${item.entryType === 'CREDIT' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {item.entryType === 'CREDIT' ? '+' : '-'}{formatCurrencyAmount(Number(item.amount), item.currency)}
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant="success">{item.status}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

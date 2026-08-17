'use client';

import React, { useState } from 'react';
import { FinancialAccountSummary, LedgerEntryPayload } from '../types';
import { requestPayoutAction } from '../actions';
import { formatCurrencyAmount } from '../rules';
import { Badge } from '@/components/ui/Badge';
import { DollarSign, CreditCard, Send, History, ArrowDownLeft, ArrowUpRight, ShieldCheck, AlertCircle } from 'lucide-react';

export interface EarningsCockpitClientProps {
  wallet: FinancialAccountSummary;
  ledger: any[];
  requests: any[];
}

export const EarningsCockpitClient: React.FC<EarningsCockpitClientProps> = ({ wallet, ledger, requests }) => {
  const [amount, setAmount] = useState<number>(5000);
  const [bankName, setBankName] = useState<string>('Access Bank');
  const [accountNumber, setAccountNumber] = useState<string>('0123456789');
  const [accountName, setAccountName] = useState<string>('Oluwatobi Lawrence');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'NETWORK_MARKETING' | 'DIGITAL_MARKETING'>('ALL');

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || amount > wallet.balance) {
      alert(`Invalid amount. Must be between ₦1 and ₦${wallet.balance.toLocaleString()}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await requestPayoutAction(
        amount,
        'BANK_TRANSFER',
        { bankName, accountNumber, accountName },
        wallet.currency
      );
      alert('Withdrawal payment request submitted successfully for admin review!');
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Payout request failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredLedger = ledger.filter((item) => {
    if (activeTab === 'ALL') return true;
    return item.businessDomain === activeTab;
  });

  return (
    <div className="space-y-6">
      {/* Payout Request Form & Domain Filter Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Request Payout Form */}
        <div className="p-5 rounded-2xl bg-bg-surface border border-border-subtle space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border-subtle">
            <CreditCard className="w-4 h-4 text-wine-text" />
            <h3 className="text-sm font-extrabold text-white uppercase">Request Payout</h3>
          </div>

          <form onSubmit={handleRequestSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-txt-muted mb-1 font-mono">Amount (NGN)</label>
              <input
                type="number"
                min="1000"
                max={wallet.balance}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-txt-muted mb-1 font-mono">Bank Name</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-txt-muted mb-1 font-mono">Account Number</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-txt-muted mb-1 font-mono">Account Name</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || wallet.balance <= 0}
              className="w-full py-2.5 rounded-lg bg-wine-primary hover:bg-wine-accent text-white font-bold transition-all flex items-center justify-center gap-2 mt-2"
            >
              <Send className="w-3.5 h-3.5" />
              Submit Payout Request
            </button>
          </form>
        </div>

        {/* Withdrawal Requests History */}
        <div className="p-5 rounded-2xl bg-bg-surface border border-border-subtle lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
            <h3 className="text-sm font-extrabold text-white uppercase">Payout Requests Log</h3>
            <Badge variant="outline">{requests.length} Requests</Badge>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {requests.length === 0 ? (
              <div className="p-4 text-center text-xs text-txt-muted">No withdrawal requests submitted yet.</div>
            ) : (
              requests.map((r) => (
                <div key={r.id} className="p-3 rounded-lg bg-bg-surface-elevated/40 border border-border-subtle flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="font-bold text-white">{formatCurrencyAmount(Number(r.amount), r.currency)}</div>
                    <div className="text-[10px] text-txt-muted font-mono">{new Date(r.requestedAt).toLocaleDateString()}</div>
                    {r.rejectionReason && (
                      <div className="text-[10px] text-rose-400 font-mono">Reason: {r.rejectionReason}</div>
                    )}
                  </div>
                  <Badge variant={r.status === 'PROCESSED' ? 'success' : r.status === 'REJECTED' ? 'outline' : 'warning'}>
                    {r.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Immutable Append-Only Ledger Table */}
      <div className="p-6 rounded-2xl bg-bg-surface border border-border-subtle space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border-subtle">
          <div>
            <h2 className="text-lg font-extrabold text-white">TRANSACTION LEDGER</h2>
            <p className="text-xs text-txt-muted">Immutable append-only transaction history</p>
          </div>

          {/* Domain Filter Tabs */}
          <div className="flex items-center gap-2 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${activeTab === 'ALL' ? 'bg-wine-primary text-white' : 'text-txt-muted hover:text-white'}`}
            >
              All Domains
            </button>
            <button
              onClick={() => setActiveTab('NETWORK_MARKETING')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${activeTab === 'NETWORK_MARKETING' ? 'bg-wine-primary text-white' : 'text-txt-muted hover:text-white'}`}
            >
              Network Marketing
            </button>
            <button
              onClick={() => setActiveTab('DIGITAL_MARKETING')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${activeTab === 'DIGITAL_MARKETING' ? 'bg-wine-primary text-white' : 'text-txt-muted hover:text-white'}`}
            >
              Digital Marketing
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border-subtle text-txt-muted uppercase tracking-wider text-[10px]">
                <th className="p-3">Date</th>
                <th className="p-3">Domain</th>
                <th className="p-3">Category</th>
                <th className="p-3">Description</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/40">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-txt-muted">
                    No transactions found in selected domain.
                  </td>
                </tr>
              ) : (
                filteredLedger.map((item) => (
                  <tr key={item.id} className="hover:bg-bg-surface-elevated/30 transition-all font-mono">
                    <td className="p-3 text-txt-muted">{new Date(item.createdAt).toLocaleDateString()}</td>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

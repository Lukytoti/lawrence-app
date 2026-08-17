import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getMemberWalletSummary, getMemberLedgerHistory } from '@/modules/finance/service';
import { formatCurrencyAmount } from '@/modules/finance/rules';
import { Badge } from '@/components/ui/Badge';
import { DollarSign, CreditCard, ArrowUpRight, ArrowDownLeft, ShieldCheck, Wallet, History, AlertCircle } from 'lucide-react';
import { EarningsCockpitClient } from '@/modules/finance/components/EarningsCockpitClient';
import { MemberEarningsClient } from '@/modules/compensation/components/MemberEarningsClient';

export default async function EarningsPage() {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) {
    redirect('/login');
  }

  const userId = (session?.user as any).id;
  const member = await db.networkMember.findUnique({
    where: { userId },
  });

  if (!member) {
    return (
      <div className="p-8 text-center text-txt-muted">
        No active network member profile associated with account.
      </div>
    );
  }

  const walletNGN = await getMemberWalletSummary(member.id, 'NGN');
  const ledgerNGN = await getMemberLedgerHistory(member.id, 'NGN');

  const pendingRequests = await db.paymentRequest.findMany({
    where: { memberId: member.id },
    orderBy: { requestedAt: 'desc' },
  });

  const compensationResults = await db.memberCompensationResult.findMany({
    where: { memberId: member.id },
    include: { period: true, earningLines: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-bg-surface via-wine-deep/40 to-bg-surface border border-wine-primary/60 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="wine">IMMUTABLE FINANCIAL LEDGER</Badge>
            <span className="text-xs text-txt-muted font-mono">APPEND-ONLY ACCOUNTING</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">MEMBER FINANCIAL COCKPIT</h1>
          <p className="text-xs text-txt-muted">Derived balances, Network Marketing & Digital Marketing earnings, payout requests</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="p-4 rounded-xl bg-bg-surface-elevated/60 border border-wine-primary/50 text-right">
            <div className="text-[10px] text-txt-muted font-extrabold uppercase tracking-wider">Available Balance (NGN)</div>
            <div className="text-2xl font-black text-emerald-400">{formatCurrencyAmount(walletNGN.balance, 'NGN')}</div>
          </div>
        </div>
      </div>

      {/* Account Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-bg-surface border border-border-subtle flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-950/50 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-txt-muted font-extrabold uppercase">Total Posted Credits</div>
            <div className="text-xl font-extrabold text-white">{formatCurrencyAmount(walletNGN.totalCredits, 'NGN')}</div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-bg-surface border border-border-subtle flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-950/50 border border-rose-800/60 flex items-center justify-center text-rose-400">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-txt-muted font-extrabold uppercase">Total Posted Debits</div>
            <div className="text-xl font-extrabold text-white">{formatCurrencyAmount(walletNGN.totalDebits, 'NGN')}</div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-bg-surface border border-border-subtle flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-wine-primary/30 border border-wine-primary/60 flex items-center justify-center text-wine-text">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-txt-muted font-extrabold uppercase">Wallet Status</div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <Badge variant="success">{walletNGN.status}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Itemized Member Compensation Results Breakdown */}
      <MemberEarningsClient memberResults={compensationResults} memberCode={member.memberCode} />

      {/* Client Interactive Workspace */}
      <EarningsCockpitClient wallet={walletNGN} ledger={ledgerNGN} requests={pendingRequests} />
    </div>
  );
}

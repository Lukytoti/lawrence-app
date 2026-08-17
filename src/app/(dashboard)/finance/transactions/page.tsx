import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { hasPermission } from '@/lib/rbac';
import { formatCurrencyAmount } from '@/modules/finance/rules';
import { Badge } from '@/components/ui/Badge';
import { DollarSign, ShieldAlert, CheckCircle, XCircle, ArrowUpRight, ArrowDownLeft, Sliders } from 'lucide-react';
import { AdminTransactionsClient } from '@/modules/finance/components/AdminTransactionsClient';

export default async function AdminTransactionsPage() {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) {
    redirect('/login');
  }

  const userId = (session?.user as any).id;
  const authorized = await hasPermission(userId, 'finance:manage');

  if (!authorized) {
    return (
      <div className="p-8 text-center text-rose-400">
        Unauthorized: Administrative financial permissions required (finance:manage).
      </div>
    );
  }

  const pendingRequests = await db.paymentRequest.findMany({
    where: { status: 'PENDING' },
    include: {
      account: {
        include: {
          member: {
            include: { user: { include: { profile: true } } },
          },
        },
      },
    },
    orderBy: { requestedAt: 'asc' },
  });

  const recentLedger = await db.ledgerEntry.findMany({
    take: 50,
    orderBy: { createdAt: 'desc' },
    include: {
      account: {
        include: {
          member: {
            include: { user: { include: { profile: true } } },
          },
        },
      },
    },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-bg-surface via-wine-deep/40 to-bg-surface border border-wine-primary/60 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="wine">SUPER ADMIN & FINANCIAL MANAGEMENT</Badge>
            <span className="text-xs text-txt-muted font-mono">ORGANIZATION LEDGER CONTROL</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">ADMIN FINANCIAL DASHBOARD</h1>
          <p className="text-xs text-txt-muted">Approve/reject payout requests, post offsetting adjustments, audit organization ledger</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="p-4 rounded-xl bg-bg-surface-elevated/60 border border-wine-primary/50 text-right">
            <div className="text-[10px] text-txt-muted font-extrabold uppercase tracking-wider">Pending Payout Requests</div>
            <div className="text-2xl font-black text-amber-400">{pendingRequests.length}</div>
          </div>
        </div>
      </div>

      {/* Admin Client Workspace */}
      <AdminTransactionsClient pendingRequests={pendingRequests} recentLedger={recentLedger} />
    </div>
  );
}

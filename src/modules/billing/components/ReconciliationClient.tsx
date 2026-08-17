'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface ReconciliationClientProps {
  unreconciledPayments: any[];
}

export function ReconciliationClient({ unreconciledPayments }: ReconciliationClientProps) {
  const [payments] = useState(unreconciledPayments || []);

  return (
    <div className="min-h-screen bg-[#09090B] text-slate-100 p-6 space-y-6">
      <Link href="/billing" className="text-xs text-slate-400 hover:text-slate-200 transition-colors">
        ← Back to Billing Command Center
      </Link>

      <div className="flex items-center justify-between border-b border-white/10 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Payment Reconciliation Workspace</h1>
          <p className="text-sm text-slate-400">
            Reconcile client payment collection records with Prompt 05 double-entry financial ledger journal transactions
          </p>
        </div>
      </div>

      <div className="bg-[#111113] border border-white/10 rounded-xl p-5 space-y-4">
        <h3 className="text-lg font-semibold text-white">Pending Reconciliation Payments</h3>
        <div className="space-y-3">
          {payments.length === 0 ? (
            <p className="text-sm text-slate-500">All payments are fully reconciled with Prompt 05 ledger.</p>
          ) : (
            payments.map((p) => (
              <div key={p.id} className="p-4 bg-[#18181B] border border-white/5 rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs text-slate-400">{p.paymentReference}</span>
                  <h4 className="text-sm font-semibold text-white">{p.client?.companyName || p.client?.contactName}</h4>
                  <p className="text-xs text-slate-400">Method: {p.paymentMethod} | Status: {p.status}</p>
                </div>
                <div className="text-right space-y-1">
                  <div className="font-mono text-sm font-bold text-emerald-400">
                    {p.currency} {Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

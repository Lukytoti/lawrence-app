'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface BillingDashboardClientProps {
  invoices: any[];
  unreconciledPayments: any[];
  userId: string;
}

export function BillingDashboardClient({ invoices, unreconciledPayments }: BillingDashboardClientProps) {
  const [invoiceList] = useState(invoices || []);
  const [unreconciledList] = useState(unreconciledPayments || []);

  const totalBilled = invoiceList.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
  const totalPaid = invoiceList.reduce((sum, inv) => sum + Number(inv.amountPaid || 0), 0);
  const totalOutstanding = invoiceList.reduce((sum, inv) => sum + Number(inv.amountDue || 0), 0);
  const overdueInvoices = invoiceList.filter((inv) => inv.status === 'OVERDUE');
  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + Number(inv.amountDue || 0), 0);

  return (
    <div className="min-h-screen bg-[#09090B] text-slate-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-wine-500 bg-[#7F1D1D] animate-pulse"></span>
            <span className="text-xs font-mono uppercase tracking-widest text-wine-300">
              Commercial Revenue Engine
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mt-1">
            Client Billing & Invoicing Command Center
          </h1>
          <p className="text-sm text-slate-400">
            Digital marketing & outsourcing client billing, payment collection, and ledger reconciliation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/billing/invoices"
            className="px-4 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors border border-white/10"
          >
            All Invoices
          </Link>
          <Link
            href="/billing/contracts"
            className="px-4 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors border border-white/10"
          >
            Contracts
          </Link>
          <Link
            href="/billing/reconciliation"
            className="px-4 py-2 text-xs font-medium bg-[#7F1D1D] hover:bg-[#991B1B] text-white rounded-md transition-colors"
          >
            Reconciliation Workspace ({unreconciledList.length})
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111113] border border-white/10 rounded-xl p-4 space-y-1">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Billed</span>
          <div className="text-2xl font-bold font-mono text-white">
            NGN {totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-slate-500">Across all commercial invoices</span>
        </div>

        <div className="bg-[#111113] border border-emerald-500/20 rounded-xl p-4 space-y-1">
          <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Total Paid</span>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            NGN {totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-slate-500">Collected payment revenue</span>
        </div>

        <div className="bg-[#111113] border border-amber-500/20 rounded-xl p-4 space-y-1">
          <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">Total Outstanding</span>
          <div className="text-2xl font-bold font-mono text-amber-400">
            NGN {totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-slate-500">Pending receivables</span>
        </div>

        <div className="bg-[#111113] border border-red-500/20 rounded-xl p-4 space-y-1">
          <span className="text-xs font-medium text-red-400 uppercase tracking-wider">Overdue Balance</span>
          <div className="text-2xl font-bold font-mono text-red-400">
            NGN {overdueAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-slate-500">{overdueInvoices.length} invoice(s) past due</span>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-[#111113] border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Recent Invoices</h3>
          <Link href="/billing/invoices" className="text-xs text-[#991B1B] hover:underline">
            View All Invoices →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#18181B] text-xs uppercase tracking-wider text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Issue / Due Date</th>
                <th className="px-4 py-3">Total Amount</th>
                <th className="px-4 py-3">Amount Due</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {invoiceList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No commercial invoices issued yet.
                  </td>
                </tr>
              ) : (
                invoiceList.slice(0, 10).map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-200">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 font-medium text-white">
                      {inv.client?.companyName || inv.client?.contactName}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(inv.issueDate).toLocaleDateString()} / {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-200">
                      {inv.currency} {Number(inv.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-amber-300 font-semibold">
                      {inv.currency} {Number(inv.amountDue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : inv.status === 'OVERDUE'
                          ? 'bg-red-500/20 text-red-300'
                          : inv.status === 'PARTIALLY_PAID'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/billing/invoices/${inv.id}`}
                        className="px-3 py-1 text-xs font-medium bg-[#7F1D1D] hover:bg-[#991B1B] text-white rounded transition-colors"
                      >
                        View Invoice
                      </Link>
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
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface InvoiceListClientProps {
  invoices: any[];
}

export function InvoiceListClient({ invoices }: InvoiceListClientProps) {
  const [invoiceList] = useState(invoices || []);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredInvoices = invoiceList.filter((inv) => {
    if (statusFilter === 'ALL') return true;
    return inv.status === statusFilter;
  });

  return (
    <div className="min-h-screen bg-[#09090B] text-slate-100 p-6 space-y-6">
      <Link href="/billing" className="text-xs text-slate-400 hover:text-slate-200 transition-colors">
        ← Back to Billing Command Center
      </Link>

      <div className="flex items-center justify-between border-b border-white/10 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Commercial Invoices</h1>
          <p className="text-sm text-slate-400">
            Manage client invoice issuance, payment tracking, and status transitions
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        {['ALL', 'DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              statusFilter === st
                ? 'bg-[#7F1D1D] text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Invoice Table */}
      <div className="bg-[#111113] border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#18181B] text-xs uppercase tracking-wider text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-4 py-3">Invoice Number</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Issue Date</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Total Amount</th>
                <th className="px-4 py-3">Amount Due</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No invoices found matching status filter.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-200">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 font-medium text-white">{inv.client?.companyName || inv.client?.contactName}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(inv.issueDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(inv.dueDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-200">
                      {inv.currency} {Number(inv.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-amber-300 font-semibold">
                      {inv.currency} {Number(inv.amountDue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        inv.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/billing/invoices/${inv.id}`}
                        className="px-3 py-1 text-xs font-medium bg-[#7F1D1D] hover:bg-[#991B1B] text-white rounded transition-colors"
                      >
                        View
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

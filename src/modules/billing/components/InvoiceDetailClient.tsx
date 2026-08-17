'use client';

import React from 'react';
import Link from 'next/link';

interface InvoiceDetailClientProps {
  invoice: any;
}

export function InvoiceDetailClient({ invoice }: InvoiceDetailClientProps) {
  if (!invoice) {
    return <div className="p-8 text-center text-slate-400">Invoice not found.</div>;
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-slate-100 p-6 space-y-6">
      <Link href="/billing/invoices" className="text-xs text-slate-400 hover:text-slate-200 transition-colors">
        ← Back to Invoices
      </Link>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {invoice.invoiceNumber}
            </span>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-300">
              {invoice.status}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mt-1">
            Invoice {invoice.invoiceNumber}
          </h1>
          <p className="text-sm text-slate-400">
            Billed To: {invoice.client?.companyName} ({invoice.client?.contactName})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/client/billing/invoices/${invoice.id}`}
            target="_blank"
            className="px-4 py-2 text-xs font-medium bg-emerald-700 hover:bg-emerald-600 text-white rounded-md transition-colors"
          >
            Preview Client Portal Invoice
          </Link>
        </div>
      </div>

      {/* Invoice Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#111113] border border-white/10 rounded-xl p-4">
          <span className="text-xs text-slate-400 uppercase">Subtotal</span>
          <div className="text-lg font-bold font-mono text-white mt-1">
            {invoice.currency} {Number(invoice.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-[#111113] border border-white/10 rounded-xl p-4">
          <span className="text-xs text-slate-400 uppercase">Total Amount</span>
          <div className="text-lg font-bold font-mono text-white mt-1">
            {invoice.currency} {Number(invoice.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-[#111113] border border-emerald-500/20 rounded-xl p-4">
          <span className="text-xs text-emerald-400 uppercase">Amount Paid</span>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
            {invoice.currency} {Number(invoice.amountPaid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-[#111113] border border-amber-500/20 rounded-xl p-4">
          <span className="text-xs text-amber-400 uppercase">Amount Due</span>
          <div className="text-lg font-bold font-mono text-amber-400 mt-1">
            {invoice.currency} {Number(invoice.amountDue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="bg-[#111113] border border-white/10 rounded-xl p-5 space-y-4">
        <h3 className="text-lg font-semibold text-white">Itemized Line Items</h3>
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-[#18181B] text-xs uppercase tracking-wider text-slate-400 border-b border-white/10">
            <tr>
              <th className="px-4 py-2">Description</th>
              <th className="px-4 py-2">Quantity</th>
              <th className="px-4 py-2">Unit Price</th>
              <th className="px-4 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {invoice.lineItems?.map((li: any) => (
              <tr key={li.id}>
                <td className="px-4 py-3 font-medium text-white">{li.description}</td>
                <td className="px-4 py-3 font-mono text-xs">{Number(li.quantity)}</td>
                <td className="px-4 py-3 font-mono text-xs">
                  {invoice.currency} {Number(li.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-slate-200">
                  {invoice.currency} {Number(li.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payments History */}
      <div className="bg-[#111113] border border-white/10 rounded-xl p-5 space-y-4">
        <h3 className="text-lg font-semibold text-white">Payment & Allocation History</h3>
        {invoice.allocations?.length === 0 ? (
          <p className="text-sm text-slate-500">No payment allocations recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {invoice.allocations?.map((alloc: any) => (
              <div key={alloc.id} className="p-3 bg-[#18181B] border border-white/5 rounded text-xs flex items-center justify-between">
                <div>
                  <span className="font-mono text-slate-400">Ref: {alloc.payment?.paymentReference}</span>
                  <p className="text-slate-300">Method: {alloc.payment?.paymentMethod}</p>
                </div>
                <span className="font-mono font-bold text-emerald-400">
                  + {invoice.currency} {Number(alloc.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

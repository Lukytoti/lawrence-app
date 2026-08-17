'use client';

import React from 'react';

interface ClientBillingPortalClientProps {
  invoices: any[];
  client: any;
}

export function ClientBillingPortalClient({ invoices, client }: ClientBillingPortalClientProps) {
  return (
    <div className="min-h-screen bg-[#09090B] text-slate-100 p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-white/10 pb-5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
          <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">
            Client Billing Portal
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white mt-1">Invoices & Statements</h1>
        <p className="text-sm text-slate-400">
          Client: {client?.companyName || client?.contactName}
        </p>
      </div>

      {/* Invoices List */}
      <div className="bg-[#111113] border border-white/10 rounded-xl p-5 space-y-4">
        <h3 className="text-lg font-semibold text-white">Your Commercial Invoices</h3>
        <div className="space-y-3">
          {invoices?.length === 0 ? (
            <p className="text-sm text-slate-500">No invoices available.</p>
          ) : (
            invoices?.map((inv: any) => (
              <div key={inv.id} className="p-4 bg-[#18181B] border border-white/5 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-slate-400">{inv.invoiceNumber}</span>
                  <h4 className="text-sm font-semibold text-white">
                    Due Date: {new Date(inv.dueDate).toLocaleDateString()}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Total: {inv.currency} {Number(inv.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <div className="font-mono text-sm font-bold text-amber-300">
                    Due: {inv.currency} {Number(inv.amountDue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-300">
                    {inv.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

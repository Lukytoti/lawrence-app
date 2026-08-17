'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface ContractBillingClientProps {
  contracts: any[];
}

export function ContractBillingClient({ contracts }: ContractBillingClientProps) {
  const [contractList] = useState(contracts || []);

  return (
    <div className="min-h-screen bg-[#09090B] text-slate-100 p-6 space-y-6">
      <Link href="/billing" className="text-xs text-slate-400 hover:text-slate-200 transition-colors">
        ← Back to Billing Command Center
      </Link>

      <div className="flex items-center justify-between border-b border-white/10 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Client Commercial Contracts</h1>
          <p className="text-sm text-slate-400">
            Commercial agreements, terms, contract value metadata, and billing schedule links
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contractList.map((ctr) => (
          <div key={ctr.id} className="bg-[#111113] border border-white/10 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                {ctr.contractCode}
              </span>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-300">
                {ctr.status}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white">{ctr.title}</h3>
            <p className="text-xs text-slate-400">Client: {ctr.client?.companyName || ctr.client?.contactName}</p>

            <div className="text-xs text-slate-300 space-y-1 pt-2 border-t border-white/5">
              <div>Contract Value: <span className="font-mono font-bold text-emerald-400">{ctr.currency} {Number(ctr.contractValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
              <div>Payment Terms: <span className="text-slate-400">{ctr.paymentTerms}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import {
  DollarSign,
  Award,
  TrendingUp,
  Shield,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface MemberEarningsClientProps {
  memberResults: any[];
  memberCode: string;
}

export function MemberEarningsClient({ memberResults, memberCode }: MemberEarningsClientProps) {
  const latestResult = memberResults[0];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/60 border border-white/10 p-6 rounded-xl backdrop-blur-md">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-rose-500" />
          Member Earnings & Compensation Breakdown
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Itemized Monthly Earnings, SVB qualification tier, explanations, and ledger posting status.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-900/70 border border-white/10 p-5 rounded-xl space-y-2">
          <span className="text-xs text-slate-400">Current Payable Earnings</span>
          <p className="text-2xl font-extrabold text-white">
            {latestResult ? Number(latestResult.finalPayableAmount).toLocaleString() : '0'} NGN
          </p>
          <span className="text-[10px] text-emerald-400 font-mono">Double-Entry Verified</span>
        </div>

        <div className="bg-slate-900/70 border border-white/10 p-5 rounded-xl space-y-2">
          <span className="text-xs text-slate-400">Qualifying QPV Volume</span>
          <p className="text-2xl font-extrabold text-cyan-400">
            {latestResult ? Number(latestResult.qualifyingQPV).toLocaleString() : '0'} QPV
          </p>
          <span className="text-[10px] text-cyan-300 font-mono">Rank: {latestResult?.qualifiedRankCode || 'DISTRIBUTOR'}</span>
        </div>

        <div className="bg-slate-900/70 border border-white/10 p-5 rounded-xl space-y-2">
          <span className="text-xs text-slate-400">Posting Status</span>
          <p className="text-2xl font-extrabold text-rose-300 font-mono">
            {latestResult?.status || 'NO_RECORD'}
          </p>
          <span className="text-[10px] text-slate-400 font-mono">Reference: {latestResult?.postedTransactionId ? 'POSTED' : 'PENDING'}</span>
        </div>
      </div>

      {/* Itemized Earning History */}
      <div className="bg-slate-900/70 border border-white/10 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-rose-500" />
          Compensation Period Breakdowns
        </h2>

        {memberResults.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 bg-slate-950/40 rounded-lg">
            No calculated compensation records available.
          </div>
        ) : (
          <div className="space-y-6">
            {memberResults.map((res) => (
              <div key={res.id} className="bg-slate-950/60 border border-white/10 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div>
                    <span className="text-sm font-bold text-white font-mono">
                      Period: {res.period?.year}/{String(res.period?.month).padStart(2, '0')}
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Qualified Rank: <span className="text-rose-300 font-semibold">{res.qualifiedRankCode}</span> | Achieved Rank: {res.achievedRankCode}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {Number(res.finalPayableAmount).toLocaleString()} {res.currency}
                  </span>
                </div>

                {/* Line Items */}
                <div className="space-y-2">
                  {res.earningLines?.map((line: any) => (
                    <div
                      key={line.id}
                      className="bg-slate-900/80 p-3 rounded-lg border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-rose-300 font-mono">[{line.category}]</span>
                          <span className="text-slate-200">{line.rateOrFormulaRef}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                              line.eligibilityStatus === 'QUALIFIED'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                                : 'bg-amber-950 text-amber-300 border border-amber-800/40'
                            }`}
                          >
                            {line.eligibilityStatus}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{line.explanationJson}</p>
                      </div>

                      <span className="font-bold text-white font-mono self-end sm:self-center">
                        {Number(line.calculatedAmount).toLocaleString()} {res.currency}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

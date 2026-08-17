'use client';

import React from 'react';

interface Props {
  reviews: any[];
}

export default function AccessReviewClient({ reviews }: Props) {
  return (
    <div className="p-6 bg-[#09090B] text-slate-100 min-h-screen space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span>🔑</span> Access Governance & RBAC Reviews
        </h1>
        <p className="text-xs text-slate-400 mt-1">Periodic permission oversight, access review state machine & privilege audit.</p>
      </div>

      <div className="bg-[#111113] border border-white/10 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">Access Reviews ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">No access reviews currently pending.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {reviews.map((rev) => (
              <div key={rev.id} className="py-4 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono text-sky-400 font-bold mr-2">{rev.reviewCode}</span>
                  <span className="text-slate-300">Target User: {rev.userId}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded bg-sky-500/20 text-sky-300 font-semibold text-[10px]">
                    {rev.status}
                  </span>
                  <span className="text-slate-500">{new Date(rev.startedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { executeCampaignAction } from '../actions';

interface CampaignListClientProps {
  initialCampaigns: any[];
  currentUserId: string;
}

export function CampaignListClient({ initialCampaigns, currentUserId }: CampaignListClientProps) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleExecute(campaignId: string) {
    setLoadingId(campaignId);
    try {
      const updated = await executeCampaignAction(campaignId, currentUserId);
      setCampaigns(campaigns.map((c) => (c.id === campaignId ? updated : c)));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Notification Campaigns</h1>
          <p className="text-sm text-zinc-400 mt-1">Multi-channel batch message outreach and recipient group dispatching</p>
        </div>
      </div>

      <div className="space-y-4">
        {campaigns.length === 0 ? (
          <div className="p-8 rounded-xl bg-zinc-900/60 border border-white/10 text-center text-zinc-500 text-sm">
            No notification campaigns configured yet.
          </div>
        ) : (
          campaigns.map((cmp) => (
            <div key={cmp.id} className="p-4 rounded-xl bg-zinc-900/60 border border-white/10 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-white">{cmp.name}</span>
                  <span className="px-2 py-0.5 text-xs font-mono rounded bg-zinc-800 text-zinc-400 border border-white/10">
                    {cmp.campaignCode}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">Segment: {cmp.targetSegment} • Template: {cmp.template?.name || cmp.templateId}</p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`px-2.5 py-1 text-xs font-semibold rounded ${
                    cmp.status === 'COMPLETED'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : cmp.status === 'SENDING'
                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                      : 'bg-zinc-800 text-zinc-300 border border-white/10'
                  }`}
                >
                  {cmp.status}
                </span>
                {cmp.status === 'DRAFT' && (
                  <button
                    onClick={() => handleExecute(cmp.id)}
                    disabled={loadingId === cmp.id}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-burgundy-900 hover:bg-burgundy-800 rounded transition-colors disabled:opacity-50"
                  >
                    {loadingId === cmp.id ? 'Running...' : 'Execute Campaign'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

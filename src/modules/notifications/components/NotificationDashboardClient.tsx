'use client';

import React from 'react';
import Link from 'next/link';

interface NotificationDashboardClientProps {
  initialData: {
    metrics: {
      totalTemplates: number;
      totalMessages: number;
      totalDeliveries: number;
      totalCampaigns: number;
      deliveredCount: number;
      failedCount: number;
      suppressedCount: number;
      deliverySuccessRate: number;
    };
    recentMessages: any[];
  };
}

export function NotificationDashboardClient({ initialData }: NotificationDashboardClientProps) {
  const { metrics, recentMessages } = initialData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Notification Command Center</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Multi-channel messaging engine, provider delivery tracking, and recipient preferences
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/notifications/templates"
            className="px-4 py-2 text-sm font-medium text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-white/10 transition-colors"
          >
            Template Library
          </Link>
          <Link
            href="/notifications/campaigns"
            className="px-4 py-2 text-sm font-medium text-white bg-burgundy-900 hover:bg-burgundy-800 rounded-lg border border-burgundy-700 shadow-sm transition-colors"
          >
            Launch Campaign
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/10">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Messages</span>
          <p className="text-3xl font-bold text-white mt-2">{metrics.totalMessages}</p>
          <span className="text-xs text-zinc-500 mt-1 block">All channels combined</span>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/10">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Delivered</span>
          <p className="text-3xl font-bold text-emerald-400 mt-2">{metrics.deliveredCount}</p>
          <span className="text-xs text-emerald-500/80 mt-1 block">Success rate: {metrics.deliverySuccessRate}%</span>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/10">
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Suppressed / Quiet Hours</span>
          <p className="text-3xl font-bold text-amber-400 mt-2">{metrics.suppressedCount}</p>
          <span className="text-xs text-amber-500/80 mt-1 block">Preferences & Quiet Hours</span>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/10">
          <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Failed</span>
          <p className="text-3xl font-bold text-rose-400 mt-2">{metrics.failedCount}</p>
          <span className="text-xs text-rose-500/80 mt-1 block">Provider delivery trace errors</span>
        </div>
      </div>

      {/* Recent Messages */}
      <div className="rounded-xl bg-zinc-900/60 border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Recent Notification Deliveries</h2>
          <Link href="/notifications/deliveries" className="text-xs text-burgundy-400 hover:underline">
            View All Deliveries →
          </Link>
        </div>
        <div className="divide-y divide-white/5">
          {recentMessages.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">No notification messages recorded yet.</div>
          ) : (
            recentMessages.map((msg) => (
              <div key={msg.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs font-semibold rounded bg-zinc-800 text-zinc-300 border border-white/10">
                      {msg.channel}
                    </span>
                    <span className="text-sm font-medium text-white">{msg.subject || 'Notification Dispatch'}</span>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-1">{msg.bodyContent}</p>
                  <span className="text-[11px] text-zinc-500">Code: {msg.messageCode} • Key: {msg.idempotencyKey}</span>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${
                      msg.status === 'DELIVERED'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : msg.status === 'CANCELLED'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {msg.status}
                  </span>
                  <span className="block text-[11px] text-zinc-500 mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString()}
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

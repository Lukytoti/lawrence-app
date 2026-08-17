'use client';

import React, { useState } from 'react';
import {
  calculateClientHealthAction,
  createRetentionCaseAction,
  createClientTouchpointAction,
  createSuccessPlanAction,
} from '../actions';

interface Props {
  client: any;
  currentUserId: string;
}

export function ClientCockpitClient({ client: initialClient, currentUserId }: Props) {
  const [client, setClient] = useState(initialClient);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'HEALTH' | 'PROJECTS' | 'BILLING' | 'RENEWAL' | 'CASES' | 'TOUCHPOINTS'>('OVERVIEW');
  const [isCalculating, setIsCalculating] = useState(false);
  const [newTouchpointSummary, setNewTouchpointSummary] = useState('');
  const [touchpointType, setTouchpointType] = useState('CHECK_IN');

  const latestHealth = client.healthSnapshots?.[0];
  const parsedFactors = latestHealth?.scoreFactors ? JSON.parse(latestHealth.scoreFactors) : [];

  const handleRecalculateHealth = async () => {
    setIsCalculating(true);
    try {
      await calculateClientHealthAction(currentUserId, client.id);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Failed to recalculate health.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleAddTouchpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTouchpointSummary) return;
    try {
      await createClientTouchpointAction(currentUserId, {
        clientId: client.id,
        type: touchpointType as any,
        summary: newTouchpointSummary,
        performedById: currentUserId,
      });
      setNewTouchpointSummary('');
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Failed to add touchpoint.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-zinc-900 border border-white/10 p-6 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {client.companyName || client.contactName}
            </h1>
            <span className="px-2.5 py-0.5 bg-zinc-800 text-zinc-400 font-mono text-xs rounded border border-white/10">
              {client.clientCode}
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Contact: {client.contactName} ({client.email || 'No email'})
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-zinc-400 font-semibold uppercase">Client Health Score</div>
            <div className="text-2xl font-extrabold text-white font-mono">
              {latestHealth?.healthScore ?? 100} / 100
            </div>
            <div className="text-xs text-emerald-400 font-semibold">{latestHealth?.healthStatus || 'HEALTHY'}</div>
          </div>
          <button
            onClick={handleRecalculateHealth}
            disabled={isCalculating}
            className="px-4 py-2 bg-burgundy-900 hover:bg-burgundy-800 text-white rounded-md text-xs font-semibold transition disabled:opacity-50"
          >
            {isCalculating ? 'Calculating...' : 'Recalculate Health'}
          </button>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center gap-2 border-b border-white/10 overflow-x-auto pb-2">
        {['OVERVIEW', 'HEALTH', 'PROJECTS', 'BILLING', 'RENEWAL', 'CASES', 'TOUCHPOINTS'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 text-xs font-semibold rounded-t-md transition ${
              activeTab === tab
                ? 'bg-zinc-800 text-white border-b-2 border-burgundy-500'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-zinc-900 border border-white/10 p-5 rounded-lg space-y-4">
            <h3 className="text-sm font-semibold text-white">Latest Health Analysis</h3>
            {parsedFactors.length > 0 ? (
              <div className="space-y-2">
                {parsedFactors.map((f: any, idx: number) => (
                  <div key={idx} className="p-3 bg-zinc-950 rounded border border-white/5 text-xs flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-zinc-300">{f.category}</div>
                      <div className="text-zinc-500 mt-0.5">{f.description}</div>
                    </div>
                    <span className="font-mono font-bold text-rose-400">{f.impactScore}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500">No negative factors detected. Client is healthy.</p>
            )}
          </div>

          <div className="bg-zinc-900 border border-white/10 p-5 rounded-lg space-y-4">
            <h3 className="text-sm font-semibold text-white">Record Success Touchpoint</h3>
            <form onSubmit={handleAddTouchpoint} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 font-semibold block mb-1">Touchpoint Type</label>
                <select
                  value={touchpointType}
                  onChange={(e) => setTouchpointType(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded px-3 py-1.5 text-xs text-white"
                >
                  <option value="CHECK_IN">Check-In</option>
                  <option value="CALL">Call</option>
                  <option value="EMAIL">Email</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="MEETING">Meeting</option>
                  <option value="RENEWAL_OUTREACH">Renewal Outreach</option>
                  <option value="DELIVERY_REVIEW">Delivery Review</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 font-semibold block mb-1">Summary / Notes</label>
                <textarea
                  value={newTouchpointSummary}
                  onChange={(e) => setNewTouchpointSummary(e.target.value)}
                  placeholder="Record summary of discussion..."
                  className="w-full bg-zinc-950 border border-white/10 rounded p-2 text-xs text-white h-20"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs font-semibold transition"
              >
                Save Touchpoint
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'HEALTH' && (
        <div className="bg-zinc-900 border border-white/10 p-5 rounded-lg space-y-4">
          <h3 className="text-sm font-semibold text-white">Immutable Health Snapshot History</h3>
          <div className="space-y-3">
            {client.healthSnapshots?.map((s: any) => (
              <div key={s.id} className="p-3 bg-zinc-950 rounded border border-white/5 flex justify-between items-center text-xs">
                <div>
                  <span className="font-semibold text-white">{s.healthStatus}</span>
                  <span className="text-zinc-500 ml-2">Score: {s.healthScore}</span>
                </div>
                <div className="text-zinc-500 font-mono">
                  {new Date(s.calculatedAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'PROJECTS' && (
        <div className="bg-zinc-900 border border-white/10 p-5 rounded-lg space-y-4">
          <h3 className="text-sm font-semibold text-white">Associated Service Delivery Projects</h3>
          {client.digitalProjects?.map((p: any) => (
            <div key={p.id} className="p-3 bg-zinc-950 rounded border border-white/5 text-xs flex justify-between items-center">
              <div>
                <div className="font-semibold text-white">{p.title}</div>
                <div className="text-zinc-500">Code: {p.projectCode}</div>
              </div>
              <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 font-semibold rounded text-xs">
                {p.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'TOUCHPOINTS' && (
        <div className="bg-zinc-900 border border-white/10 p-5 rounded-lg space-y-4">
          <h3 className="text-sm font-semibold text-white">Touchpoint Timeline</h3>
          {client.touchpoints?.map((t: any) => (
            <div key={t.id} className="p-3 bg-zinc-950 rounded border border-white/5 text-xs space-y-1">
              <div className="flex justify-between text-zinc-400">
                <span className="font-semibold text-white">{t.type}</span>
                <span className="font-mono">{new Date(t.contactedAt).toLocaleDateString()}</span>
              </div>
              <p className="text-zinc-300">{t.summary}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

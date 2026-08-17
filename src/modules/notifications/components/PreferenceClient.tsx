'use client';

import React, { useState } from 'react';
import { updatePreferencesAction } from '../actions';

interface PreferenceClientProps {
  initialPreference: any;
  currentUserId: string;
}

export function PreferenceClient({ initialPreference, currentUserId }: PreferenceClientProps) {
  const [pref, setPref] = useState(initialPreference);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleToggle(key: string, value: boolean) {
    const updatedPref = { ...pref, [key]: value };
    setPref(updatedPref);
    setLoading(true);
    setSaved(false);
    try {
      await updatePreferencesAction(currentUserId, { [key]: value }, currentUserId);
      setSaved(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleQuietHoursSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    try {
      await updatePreferencesAction(
        currentUserId,
        { quietHoursStart: pref.quietHoursStart, quietHoursEnd: pref.quietHoursEnd },
        currentUserId
      );
      setSaved(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-5">
        <h1 className="text-2xl font-bold text-white tracking-tight">Communication Preferences</h1>
        <p className="text-sm text-zinc-400 mt-1">Manage recipient channel opt-ins, category subscriptions, and quiet hours windows</p>
      </div>

      {saved && (
        <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs">
          Communication preferences updated successfully!
        </div>
      )}

      {/* Channel Toggles */}
      <div className="p-5 rounded-xl bg-zinc-900/60 border border-white/10 space-y-4">
        <h3 className="text-base font-semibold text-white">Channel Delivery Preferences</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 rounded bg-zinc-950 border border-white/5">
            <div>
              <span className="text-sm font-medium text-white block">Email Notifications</span>
              <span className="text-xs text-zinc-400">Receive summaries and transactional receipts</span>
            </div>
            <input
              type="checkbox"
              checked={pref.emailEnabled}
              onChange={(e) => handleToggle('emailEnabled', e.target.checked)}
              className="w-4 h-4 accent-burgundy-500 rounded"
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded bg-zinc-950 border border-white/5">
            <div>
              <span className="text-sm font-medium text-white block">SMS Notifications</span>
              <span className="text-xs text-zinc-400">High-priority alerts sent via SMS</span>
            </div>
            <input
              type="checkbox"
              checked={pref.smsEnabled}
              onChange={(e) => handleToggle('smsEnabled', e.target.checked)}
              className="w-4 h-4 accent-burgundy-500 rounded"
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded bg-zinc-950 border border-white/5">
            <div>
              <span className="text-sm font-medium text-white block">WhatsApp Messages</span>
              <span className="text-xs text-zinc-400">Direct WhatsApp automated updates</span>
            </div>
            <input
              type="checkbox"
              checked={pref.whatsappEnabled}
              onChange={(e) => handleToggle('whatsappEnabled', e.target.checked)}
              className="w-4 h-4 accent-burgundy-500 rounded"
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded bg-zinc-950 border border-white/5">
            <div>
              <span className="text-sm font-medium text-white block">In-App Notifications</span>
              <span className="text-xs text-zinc-400">In-app notifications center badges</span>
            </div>
            <input
              type="checkbox"
              checked={pref.inAppEnabled}
              onChange={(e) => handleToggle('inAppEnabled', e.target.checked)}
              className="w-4 h-4 accent-burgundy-500 rounded"
            />
          </div>
        </div>
      </div>

      {/* Quiet Hours Window */}
      <form onSubmit={handleQuietHoursSave} className="p-5 rounded-xl bg-zinc-900/60 border border-white/10 space-y-4">
        <h3 className="text-base font-semibold text-white">Quiet Hours Window</h3>
        <p className="text-xs text-zinc-400">Non-critical notifications scheduled during quiet hours will be suppressed or held until window expires.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Quiet Hours Start</label>
            <input
              type="time"
              value={pref.quietHoursStart || ''}
              onChange={(e) => setPref({ ...pref, quietHoursStart: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-zinc-950 text-white rounded border border-white/10"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Quiet Hours End</label>
            <input
              type="time"
              value={pref.quietHoursEnd || ''}
              onChange={(e) => setPref({ ...pref, quietHoursEnd: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-zinc-950 text-white rounded border border-white/10"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-burgundy-900 hover:bg-burgundy-800 rounded transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Quiet Hours'}
        </button>
      </form>
    </div>
  );
}

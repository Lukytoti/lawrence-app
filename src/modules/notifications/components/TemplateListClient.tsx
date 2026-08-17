'use client';

import React, { useState } from 'react';
import { createTemplateAction } from '../actions';

interface TemplateListClientProps {
  initialTemplates: any[];
  currentUserId: string;
}

export function TemplateListClient({ initialTemplates, currentUserId }: TemplateListClientProps) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [channel, setChannel] = useState('EMAIL');
  const [subject, setSubject] = useState('');
  const [bodyTemplate, setBodyTemplate] = useState('');
  const [category, setCategory] = useState('SYSTEM');
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const created = await createTemplateAction(
        {
          name,
          channel: channel as any,
          subject,
          bodyTemplate,
          category: category as any,
          variablesJson: ['memberName', 'invoiceNumber', 'amountDue'],
        },
        currentUserId
      );
      setTemplates([created, ...templates]);
      setShowCreate(false);
      setName('');
      setSubject('');
      setBodyTemplate('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Notification Template Library</h1>
          <p className="text-sm text-zinc-400 mt-1">Multi-channel template specifications and dynamic placeholder variables</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 text-sm font-medium text-white bg-burgundy-900 hover:bg-burgundy-800 rounded-lg border border-burgundy-700 transition-colors"
        >
          {showCreate ? 'Cancel' : '+ New Template'}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="p-5 rounded-xl bg-zinc-900 border border-white/10 space-y-4">
          <h3 className="text-base font-semibold text-white">Create Notification Template</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Template Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Overdue Invoice Alert"
                className="w-full px-3 py-2 text-sm bg-zinc-950 text-white rounded border border-white/10 focus:outline-none focus:border-burgundy-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-zinc-950 text-white rounded border border-white/10"
              >
                <option value="EMAIL">EMAIL</option>
                <option value="SMS">SMS</option>
                <option value="WHATSAPP">WHATSAPP</option>
                <option value="IN_APP">IN_APP</option>
                <option value="WEBHOOK">WEBHOOK</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-zinc-950 text-white rounded border border-white/10"
              >
                <option value="SYSTEM">SYSTEM</option>
                <option value="BILLING">BILLING</option>
                <option value="RETENTION">RETENTION</option>
                <option value="MARKETING">MARKETING</option>
                <option value="SECURITY">SECURITY</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Subject Line (Optional for SMS)</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Action Required: Invoice {{invoiceNumber}} Overdue"
              className="w-full px-3 py-2 text-sm bg-zinc-950 text-white rounded border border-white/10"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Body Template (Placeholders: &#123;&#123;memberName&#125;&#125;, &#123;&#123;amountDue&#125;&#125;)</label>
            <textarea
              required
              rows={4}
              value={bodyTemplate}
              onChange={(e) => setBodyTemplate(e.target.value)}
              placeholder="Hello {{memberName}}, your payment of {{amountDue}} is overdue."
              className="w-full px-3 py-2 text-sm bg-zinc-950 text-white rounded border border-white/10"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-600 rounded transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Save Template'}
          </button>
        </form>
      )}

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((tmpl) => (
          <div key={tmpl.id} className="p-4 rounded-xl bg-zinc-900/60 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-zinc-800 text-zinc-300 border border-white/10">
                {tmpl.channel}
              </span>
              <span className="text-xs text-zinc-500 font-mono">{tmpl.templateCode} (v{tmpl.version})</span>
            </div>
            <h3 className="text-base font-semibold text-white">{tmpl.name}</h3>
            {tmpl.subject && <p className="text-xs text-zinc-300 font-medium">Subject: {tmpl.subject}</p>}
            <p className="text-xs text-zinc-400 bg-zinc-950 p-3 rounded border border-white/5 font-mono whitespace-pre-wrap">
              {tmpl.bodyTemplate}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

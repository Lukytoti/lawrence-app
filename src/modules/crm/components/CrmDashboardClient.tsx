'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Users,
  TrendingUp,
  Target,
  Clock,
  Plus,
  Flame,
  Search,
  Filter,
  DollarSign,
  ArrowRight,
  UserCheck,
  Building,
} from 'lucide-react';
import Link from 'next/link';
import { createLeadAction } from '../actions';

interface LeadItem {
  id: string;
  leadCode: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  companyName: string | null;
  status: string;
  temperature: string;
  score: number;
  leadType: string;
  createdAt: Date | string;
}

export function CrmDashboardClient({
  leads,
  stats,
}: {
  leads: LeadItem[];
  stats: {
    totalLeads: number;
    hotLeads: number;
    openOpportunities: number;
    totalPipelineValue: number;
  };
}) {
  const [activeTab, setActiveTab] = useState<'ALL' | 'NETWORK' | 'DIGITAL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // New Lead Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [leadType, setLeadType] = useState('NETWORK_PROSPECT');
  const [source, setSource] = useState('INSTAGRAM');

  const filteredLeads = leads.filter((l) => {
    if (activeTab === 'NETWORK' && l.leadType !== 'NETWORK_PROSPECT') return false;
    if (activeTab === 'DIGITAL' && l.leadType === 'NETWORK_PROSPECT') return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.firstName.toLowerCase().includes(q) ||
      l.lastName.toLowerCase().includes(q) ||
      l.leadCode.toLowerCase().includes(q) ||
      (l.companyName && l.companyName.toLowerCase().includes(q))
    );
  });

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createLeadAction({
        firstName,
        lastName,
        email,
        phone,
        companyName,
        leadType,
        source,
      });
      setIsCreateOpen(false);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setCompanyName('');
    } catch (err: any) {
      alert(err.message || 'Failed to create lead.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Command Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-wine-primary/30 via-bg-surface-elevated/60 to-wine-deep/40 border border-wine-primary/30 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-wine-primary/40 text-wine-light border border-wine-primary/50">
              Module 06 — Prospect Command
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-txt-primary mt-1">
            CRM & Prospect Command Center
          </h1>
          <p className="text-sm text-txt-muted mt-1">
            High-performance prospect tracking, outreach pipelines, follow-ups, and lead conversion.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => setIsCreateOpen(true)} className="bg-wine-primary hover:bg-wine-light text-white font-bold gap-2">
            <Plus className="w-4 h-4" />
            Create Prospect
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-bg-surface-elevated/40 border border-wine-primary/20 hover:border-wine-primary/40 transition-all">
          <div className="flex items-center justify-between text-txt-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Prospects</span>
            <Users className="w-5 h-5 text-wine-light" />
          </div>
          <div className="text-3xl font-black text-txt-primary">{stats.totalLeads}</div>
          <div className="text-xs text-txt-muted mt-1">Active across all pipelines</div>
        </div>

        <div className="p-5 rounded-2xl bg-bg-surface-elevated/40 border border-wine-primary/20 hover:border-wine-primary/40 transition-all">
          <div className="flex items-center justify-between text-txt-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Hot Prospects</span>
            <Flame className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400">{stats.hotLeads}</div>
          <div className="text-xs text-txt-muted mt-1">High conversion probability</div>
        </div>

        <div className="p-5 rounded-2xl bg-bg-surface-elevated/40 border border-wine-primary/20 hover:border-wine-primary/40 transition-all">
          <div className="flex items-center justify-between text-txt-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Open Deals</span>
            <Target className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400">{stats.openOpportunities}</div>
          <div className="text-xs text-txt-muted mt-1">Registered opportunities</div>
        </div>

        <div className="p-5 rounded-2xl bg-bg-surface-elevated/40 border border-wine-primary/20 hover:border-wine-primary/40 transition-all">
          <div className="flex items-center justify-between text-txt-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pipeline Value</span>
            <DollarSign className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-3xl font-black text-cyan-400">
            ₦{stats.totalPipelineValue.toLocaleString()}
          </div>
          <div className="text-xs text-txt-muted mt-1">Total weighted potential</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-bg-surface-elevated/40 border border-wine-primary/20">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ALL'
                ? 'bg-wine-primary text-white shadow-lg shadow-wine-primary/30'
                : 'bg-bg-surface-elevated text-txt-muted hover:text-txt-primary'
            }`}
          >
            All Domains
          </button>
          <button
            onClick={() => setActiveTab('NETWORK')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'NETWORK'
                ? 'bg-wine-primary text-white shadow-lg shadow-wine-primary/30'
                : 'bg-bg-surface-elevated text-txt-muted hover:text-txt-primary'
            }`}
          >
            Network Marketing
          </button>
          <button
            onClick={() => setActiveTab('DIGITAL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'DIGITAL'
                ? 'bg-wine-primary text-white shadow-lg shadow-wine-primary/30'
                : 'bg-bg-surface-elevated text-txt-muted hover:text-txt-primary'
            }`}
          >
            Digital Clients
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted" />
          <input
            type="text"
            placeholder="Search leads, codes, companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-bg-surface-elevated/80 border border-wine-primary/20 text-xs text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-wine-primary/50"
          />
        </div>
      </div>

      {/* Leads Grid Table */}
      <div className="rounded-2xl bg-bg-surface-elevated/40 border border-wine-primary/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg-surface-elevated/80 border-b border-wine-primary/20 text-txt-muted uppercase font-extrabold">
              <tr>
                <th className="p-4">Lead Code</th>
                <th className="p-4">Prospect Name</th>
                <th className="p-4">Domain / Type</th>
                <th className="p-4">Company</th>
                <th className="p-4 text-center">Score</th>
                <th className="p-4 text-center">Temperature</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-wine-primary/10">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-txt-muted">
                    No prospects match the selected filter query.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-wine-primary/10 transition-colors">
                    <td className="p-4 font-mono font-bold text-wine-light">{lead.leadCode}</td>
                    <td className="p-4">
                      <div className="font-bold text-txt-primary">{lead.displayName || `${lead.firstName} ${lead.lastName}`}</div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="text-[10px] uppercase border-wine-primary/30">
                        {lead.leadType.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="p-4 text-txt-muted">{lead.companyName || '—'}</td>
                    <td className="p-4 text-center font-bold text-txt-primary">{lead.score} pts</td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          lead.temperature === 'HOT'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : lead.temperature === 'WARM'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30'
                        }`}
                      >
                        <Flame className="w-3 h-3" />
                        {lead.temperature}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant="default" className="text-[10px]">
                        {lead.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/crm/leads/${lead.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-wine-primary/20 hover:bg-wine-primary text-wine-light hover:text-white font-bold transition-all text-xs"
                      >
                        View Cockpit
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-bg-surface-elevated border border-wine-primary/40 rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-black text-txt-primary">Create New Prospect</h2>
            <form onSubmit={handleCreateLead} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-txt-muted mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-bg-surface/80 border border-wine-primary/20 text-txt-primary focus:outline-none focus:border-wine-primary"
                  />
                </div>
                <div>
                  <label className="block font-bold text-txt-muted mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-bg-surface/80 border border-wine-primary/20 text-txt-primary focus:outline-none focus:border-wine-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-txt-muted mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-bg-surface/80 border border-wine-primary/20 text-txt-primary focus:outline-none focus:border-wine-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-txt-muted mb-1">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-bg-surface/80 border border-wine-primary/20 text-txt-primary focus:outline-none focus:border-wine-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-txt-muted mb-1">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-bg-surface/80 border border-wine-primary/20 text-txt-primary focus:outline-none focus:border-wine-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-txt-muted mb-1">Domain Type</label>
                  <select
                    value={leadType}
                    onChange={(e) => setLeadType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-bg-surface/80 border border-wine-primary/20 text-txt-primary focus:outline-none focus:border-wine-primary"
                  >
                    <option value="NETWORK_PROSPECT">Network Marketing</option>
                    <option value="DIGITAL_MARKETING_PROSPECT">Digital Client</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-txt-muted mb-1">Source</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-bg-surface/80 border border-wine-primary/20 text-txt-primary focus:outline-none focus:border-wine-primary"
                  >
                    <option value="INSTAGRAM">Instagram</option>
                    <option value="LINKEDIN">LinkedIn</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="COLD_DM">Cold DM</option>
                    <option value="REFERRAL">Referral</option>
                    <option value="MANUAL">Manual</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="bg-wine-primary hover:bg-wine-light text-white font-bold">
                  {loading ? 'Creating...' : 'Save Prospect'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

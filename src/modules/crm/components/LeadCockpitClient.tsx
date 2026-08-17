'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  User,
  Phone,
  Mail,
  Building,
  Flame,
  Calendar,
  Clock,
  Plus,
  CheckCircle,
  AlertCircle,
  FileText,
  UserCheck,
  Briefcase,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import {
  scheduleFollowUpAction,
  completeFollowUpAction,
  convertLeadToMemberAction,
  convertLeadToClientAction,
  createOpportunityAction,
} from '../actions';

export function LeadCockpitClient({
  lead,
  timeline,
  scoreFactors,
}: {
  lead: any;
  timeline: any[];
  scoreFactors: any[];
}) {
  const [loading, setLoading] = useState(false);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [isOppOpen, setIsOppOpen] = useState(false);

  // Follow up form
  const [fuTitle, setFuTitle] = useState('');
  const [fuDueAt, setFuDueAt] = useState('');

  // Opp form
  const [oppTitle, setOppTitle] = useState('');
  const [oppValue, setOppValue] = useState(100000);

  const handleScheduleFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await scheduleFollowUpAction({
        leadId: lead.id,
        title: fuTitle,
        dueAt: new Date(fuDueAt),
      });
      setIsFollowUpOpen(false);
      setFuTitle('');
      setFuDueAt('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOpp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createOpportunityAction({
        leadId: lead.id,
        title: oppTitle,
        value: Number(oppValue),
        businessDomain: lead.leadType === 'NETWORK_PROSPECT' ? 'NETWORK_MARKETING' : 'DIGITAL_MARKETING',
      });
      setIsOppOpen(false);
      setOppTitle('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToMember = async () => {
    if (!confirm('Convert this prospect into an active NetworkMember?')) return;
    setLoading(true);
    try {
      const res = await convertLeadToMemberAction(lead.id);
      alert(`Prospect converted successfully! Member Code: ${res.member.memberCode}`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToClient = async () => {
    if (!confirm('Convert this prospect into a Digital Client?')) return;
    setLoading(true);
    try {
      const res = await convertLeadToClientAction(lead.id);
      alert(`Client converted successfully! Client Code: ${res.client.clientCode}`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteFollowUp = async (id: string) => {
    try {
      await completeFollowUpAction(id);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Next action calculation
  const pendingFollowUp = lead.followUps?.find((f: any) => f.status === 'PENDING');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-wine-primary/40 via-bg-surface-elevated/70 to-wine-deep/50 border border-wine-primary/30 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs text-wine-light">{lead.leadCode}</span>
              <Badge variant="outline" className="text-[10px] uppercase border-wine-primary/40">
                {lead.leadType.replace('_', ' ')}
              </Badge>
              {lead.convertedMemberId && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  CONVERTED MEMBER
                </span>
              )}
              {lead.convertedClientId && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  DIGITAL CLIENT
                </span>
              )}
            </div>
            <h1 className="text-3xl font-black text-txt-primary">
              {lead.displayName || `${lead.firstName} ${lead.lastName}`}
            </h1>
            <p className="text-xs text-txt-muted flex items-center gap-3">
              {lead.companyName && <span>🏢 {lead.companyName}</span>}
              {lead.email && <span>✉️ {lead.email}</span>}
              {lead.phone && <span>📞 {lead.phone}</span>}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!lead.convertedMemberId && (
              <Button onClick={handleConvertToMember} disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-2 text-xs">
                <UserCheck className="w-4 h-4" />
                Convert to Member
              </Button>
            )}
            {!lead.convertedClientId && (
              <Button onClick={handleConvertToClient} disabled={loading} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold gap-2 text-xs">
                <Building className="w-4 h-4" />
                Convert to Client
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Next Action Banner */}
      <div className="p-4 rounded-2xl bg-wine-primary/20 border border-wine-primary/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <div className="text-[10px] uppercase font-black tracking-wider text-txt-muted">Next Recommended Action</div>
            <div className="text-sm font-bold text-txt-primary">
              {pendingFollowUp
                ? `Follow up: "${pendingFollowUp.title}" due ${new Date(pendingFollowUp.dueAt).toLocaleString()}`
                : 'No pending follow-ups. Schedule next outreach action below.'}
            </div>
          </div>
        </div>
        <Button onClick={() => setIsFollowUpOpen(true)} size="sm" className="bg-wine-primary hover:bg-wine-light text-white font-bold gap-1 text-xs">
          <Plus className="w-3.5 h-3.5" />
          Schedule Action
        </Button>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Lead Score & Details */}
        <div className="space-y-6">
          {/* Score & Temperature Card */}
          <div className="p-5 rounded-2xl bg-bg-surface-elevated/40 border border-wine-primary/20 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-txt-muted flex items-center justify-between">
              <span>Lead Score & Temperature</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {lead.temperature}
              </span>
            </h2>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-txt-primary">{lead.score}</span>
              <span className="text-xs text-txt-muted">/ 100 points</span>
            </div>

            <div className="space-y-2 pt-2 border-t border-wine-primary/10">
              <div className="text-[10px] font-extrabold uppercase text-txt-muted">Explainable Factors:</div>
              {scoreFactors.map((f, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs text-txt-muted bg-bg-surface/50 p-2 rounded-lg">
                  <span>{f.description}</span>
                  <span className="font-bold text-emerald-400">+{f.points}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Details Card */}
          <div className="p-5 rounded-2xl bg-bg-surface-elevated/40 border border-wine-primary/20 space-y-3 text-xs">
            <h2 className="text-xs font-black uppercase tracking-wider text-txt-muted">Prospect Profile</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-txt-muted">Source:</span>
                <span className="font-bold text-txt-primary">{lead.source}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-txt-muted">Location:</span>
                <span className="font-bold text-txt-primary">{lead.city || 'Lagos'}, {lead.country}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-txt-muted">Timezone:</span>
                <span className="font-bold text-txt-primary">{lead.timezone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-txt-muted">Status:</span>
                <Badge variant="default" className="text-[10px]">{lead.status}</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Center & Right Column: Opportunities, Follow-Ups & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Opportunities Section */}
          <div className="p-5 rounded-2xl bg-bg-surface-elevated/40 border border-wine-primary/20 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-txt-muted flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-wine-light" />
                Commercial Opportunities ({lead.opportunities?.length || 0})
              </h2>
              <Button onClick={() => setIsOppOpen(true)} size="sm" variant="outline" className="text-xs gap-1 border-wine-primary/30">
                <Plus className="w-3 h-3" />
                New Opportunity
              </Button>
            </div>

            <div className="space-y-2">
              {!lead.opportunities || lead.opportunities.length === 0 ? (
                <div className="text-xs text-txt-muted italic">No active opportunities registered.</div>
              ) : (
                lead.opportunities.map((o: any) => (
                  <div key={o.id} className="p-3 rounded-xl bg-bg-surface/60 border border-wine-primary/10 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-txt-primary">{o.title}</div>
                      <div className="text-[10px] text-txt-muted">{o.businessDomain}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-emerald-400">₦{Number(o.value).toLocaleString()}</div>
                      <Badge variant="outline" className="text-[9px]">{o.status}</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Actionable Follow-Ups Section */}
          <div className="p-5 rounded-2xl bg-bg-surface-elevated/40 border border-wine-primary/20 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-txt-muted flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Follow-Up Tasks & Reminders
            </h2>

            <div className="space-y-2">
              {!lead.followUps || lead.followUps.length === 0 ? (
                <div className="text-xs text-txt-muted italic">No follow-up reminders set.</div>
              ) : (
                lead.followUps.map((f: any) => (
                  <div key={f.id} className="p-3 rounded-xl bg-bg-surface/60 border border-wine-primary/10 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-txt-primary">{f.title}</div>
                      <div className="text-[10px] text-txt-muted">Due: {new Date(f.dueAt).toLocaleString()}</div>
                    </div>
                    <div>
                      {f.status === 'PENDING' ? (
                        <Button onClick={() => handleCompleteFollowUp(f.id)} size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] py-1 px-2">
                          Mark Complete
                        </Button>
                      ) : (
                        <Badge variant="default" className="text-[10px]">{f.status}</Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Unified Timeline */}
          <div className="p-5 rounded-2xl bg-bg-surface-elevated/40 border border-wine-primary/20 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-txt-muted flex items-center gap-2">
              <FileText className="w-4 h-4 text-wine-light" />
              Chronological Activity Timeline
            </h2>

            <div className="space-y-3 relative border-l-2 border-wine-primary/30 ml-2 pl-4">
              {timeline.map((event: any) => (
                <div key={event.id} className="relative space-y-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-wine-primary absolute -left-[21px] top-1" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-txt-primary">{event.title}</span>
                    <span className="text-[10px] text-txt-muted">{new Date(event.timestamp).toLocaleString()}</span>
                  </div>
                  {event.description && <div className="text-xs text-txt-muted">{event.description}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Follow Up Modal */}
      {isFollowUpOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-bg-surface-elevated border border-wine-primary/40 rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-black text-txt-primary">Schedule Actionable Follow-Up</h2>
            <form onSubmit={handleScheduleFollowUp} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-txt-muted mb-1">Follow-Up Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Call Chidi regarding compensation plan inquiry"
                  value={fuTitle}
                  onChange={(e) => setFuTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-bg-surface/80 border border-wine-primary/20 text-txt-primary focus:outline-none focus:border-wine-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-txt-muted mb-1">Due Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={fuDueAt}
                  onChange={(e) => setFuDueAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-bg-surface/80 border border-wine-primary/20 text-txt-primary focus:outline-none focus:border-wine-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsFollowUpOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="bg-wine-primary hover:bg-wine-light text-white font-bold">
                  Schedule Reminders
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Opportunity Modal */}
      {isOppOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-bg-surface-elevated border border-wine-primary/40 rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-black text-txt-primary">Create Commercial Opportunity</h2>
            <form onSubmit={handleCreateOpp} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-txt-muted mb-1">Opportunity Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NeoLife Fast-Track Director Kit"
                  value={oppTitle}
                  onChange={(e) => setOppTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-bg-surface/80 border border-wine-primary/20 text-txt-primary focus:outline-none focus:border-wine-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-txt-muted mb-1">Estimated Value (NGN) *</label>
                <input
                  type="number"
                  required
                  value={oppValue}
                  onChange={(e) => setOppValue(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-bg-surface/80 border border-wine-primary/20 text-txt-primary focus:outline-none focus:border-wine-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsOppOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="bg-wine-primary hover:bg-wine-light text-white font-bold">
                  Register Opportunity
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

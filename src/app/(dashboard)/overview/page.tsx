import React from 'react';
import { db } from '@/lib/db';
import { getOrganizationMetrics } from '@/modules/org/service';
import { getOrganizationRankMetrics } from '@/modules/ranks/service';
import {
  ShieldAlert,
  Activity,
  CheckSquare,
  DollarSign,
  Users,
  Bell,
  ArrowRight,
  Layers,
  GitFork,
  Award,
  Target,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function MasterDashboardPage() {
  const userCount = await db.user.count();
  const roleCount = await db.role.count();
  const auditCount = await db.auditLog.count();

  // Query real database organization metrics
  const rootMember = await db.networkMember.findFirst({
    where: { status: 'ACTIVE' },
    orderBy: { joinedAt: 'asc' },
  });

  const orgMetrics = await getOrganizationMetrics(rootMember?.id);
  const rankMetrics = await getOrganizationRankMetrics();

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-bg-surface via-wine-deep/40 to-bg-surface border border-border-strong shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="wine" className="font-mono">RANK & QUALIFICATION ENGINE ACTIVE</Badge>
              <span className="text-xs text-txt-muted font-mono">v1.2.0</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Executive Command Center Overview
            </h1>
            <p className="text-sm text-txt-muted max-w-xl">
              System architecture configured with dynamic RBAC, effective-dated organization tree, PostgreSQL recursive CTEs, data-driven rank requirements, and SVB rate tables.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/plans">
              <Button variant="outline" size="sm" leftIcon={<Award className="w-4 h-4 text-amber-400" />}>
                Plan Configuration
              </Button>
            </Link>
            <Link href="/network/organization">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Organization Explorer
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Rank & Qualification Performance Bar */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-txt-primary">Rank & Qualification Performance (August 2026)</h2>
            <p className="text-xs text-txt-muted">Period qualification metrics and volume tracking</p>
          </div>
          <Link href="/admin/plans">
            <Badge variant="wine">Nigeria Plan 2026.1 Active</Badge>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-bg-surface border border-border-subtle flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-wine-primary/30 border border-wine-primary/60 text-amber-300">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-txt-muted">Qualified Directors</div>
              <div className="text-xl font-extrabold text-white mt-0.5">{rankMetrics.qualifiedDirectorsCount}</div>
              <div className="text-[10px] text-emerald-400">Level 4+ Directors</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-bg-surface border border-border-subtle flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-txt-muted">Total Period QPV</div>
              <div className="text-xl font-extrabold text-emerald-400 mt-0.5">{rankMetrics.totalQPV.toLocaleString()}</div>
              <div className="text-[10px] text-txt-muted">Qualified Point Volume</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-bg-surface border border-border-subtle flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-950/60 border border-blue-800 text-blue-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-txt-muted">Qualified Members</div>
              <div className="text-xl font-extrabold text-blue-400 mt-0.5">{rankMetrics.qualifiedMembersCount}</div>
              <div className="text-[10px] text-txt-muted">Active Period Qualified</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-bg-surface border border-border-subtle flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-txt-muted">Not Qualified</div>
              <div className="text-xl font-extrabold text-amber-400 mt-0.5">{rankMetrics.unqualifiedMembersCount}</div>
              <div className="text-[10px] text-txt-muted">Achieved Rank Retained</div>
            </div>
          </div>
        </div>
      </div>

      {/* Real Organization Performance Metrics Bar */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-txt-primary">Network Organization Live Summary</h2>
            <p className="text-xs text-txt-muted">Real-time organizational membership and tree metrics</p>
          </div>
          <Link href="/network/members">
            <Badge variant="outline">View All {orgMetrics.totalMembers} Members</Badge>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl bg-bg-surface border border-border-subtle">
            <div className="text-xs font-semibold text-txt-muted">Total Members</div>
            <div className="text-xl font-extrabold text-txt-primary mt-1">{orgMetrics.totalMembers}</div>
            <div className="text-[10px] text-emerald-400 mt-0.5">Database Verified</div>
          </div>

          <div className="p-3.5 rounded-xl bg-bg-surface border border-border-subtle">
            <div className="text-xs font-semibold text-txt-muted">Active Members</div>
            <div className="text-xl font-extrabold text-emerald-400 mt-1">{orgMetrics.activeMembers}</div>
            <div className="text-[10px] text-txt-muted mt-0.5">Operational</div>
          </div>

          <div className="p-3.5 rounded-xl bg-bg-surface border border-border-subtle">
            <div className="text-xs font-semibold text-txt-muted">Inactive</div>
            <div className="text-xl font-extrabold text-amber-400 mt-1">{orgMetrics.inactiveMembers}</div>
            <div className="text-[10px] text-txt-muted mt-0.5">Pending Action</div>
          </div>

          <div className="p-3.5 rounded-xl bg-bg-surface border border-border-subtle">
            <div className="text-xs font-semibold text-txt-muted">Exited Members</div>
            <div className="text-xl font-extrabold text-red-400 mt-1">{orgMetrics.exitedMembers}</div>
            <div className="text-[10px] text-txt-muted mt-0.5">History Preserved</div>
          </div>

          <div className="p-3.5 rounded-xl bg-bg-surface border border-border-subtle">
            <div className="text-xs font-semibold text-txt-muted">Direct Downlines</div>
            <div className="text-xl font-extrabold text-blue-400 mt-1">{orgMetrics.directDownlineCount}</div>
            <div className="text-[10px] text-txt-muted mt-0.5">Level 1 Directs</div>
          </div>

          <div className="p-3.5 rounded-xl bg-bg-surface border border-border-subtle">
            <div className="text-xs font-semibold text-txt-muted">Total Downline</div>
            <div className="text-xl font-extrabold text-wine-text mt-1">{orgMetrics.totalOrganizationCount}</div>
            <div className="text-[10px] text-txt-muted mt-0.5">Entire Network</div>
          </div>
        </div>
      </div>

      {/* Community & Leadership Summary Bar */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-txt-primary">Community & Leadership Engagement Summary</h2>
            <p className="text-xs text-txt-muted">Private community activity, training completion, and attention signals</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/community">
              <Badge variant="wine">Feed Stream</Badge>
            </Link>
            <Link href="/messages">
              <Badge variant="outline">Message Center</Badge>
            </Link>
            <Link href="/community/training">
              <Badge variant="info">Training Center</Badge>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-bg-surface border border-border-subtle">
            <div className="text-xs font-semibold text-txt-muted">Community Posts</div>
            <div className="text-xl font-extrabold text-txt-primary mt-1">
              {await db.communityPost.count({ where: { deletedAt: null } })}
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5">Active Feed Items</div>
          </div>

          <div className="p-3.5 rounded-xl bg-bg-surface border border-border-subtle">
            <div className="text-xs font-semibold text-txt-muted">Training Assignments</div>
            <div className="text-xl font-extrabold text-blue-400 mt-1">
              {await db.trainingAssignment.count()}
            </div>
            <div className="text-[10px] text-txt-muted mt-0.5">Materialized</div>
          </div>

          <div className="p-3.5 rounded-xl bg-bg-surface border border-border-subtle">
            <div className="text-xs font-semibold text-txt-muted">Completed Training</div>
            <div className="text-xl font-extrabold text-emerald-400 mt-1">
              {await db.trainingAssignment.count({ where: { status: 'COMPLETED' } })}
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5">Verified Progress</div>
          </div>

          <div className="p-3.5 rounded-xl bg-bg-surface border border-border-subtle">
            <div className="text-xs font-semibold text-txt-muted">Attention Alerts</div>
            <div className="text-xl font-extrabold text-amber-400 mt-1">
              {await db.leadershipAttentionAlert.count({ where: { isResolved: false } })}
            </div>
            <div className="text-[10px] text-amber-400 mt-0.5">Action Needed</div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { db } from '@/lib/db';
import { eventBus } from '@/lib/events';
import { calculateMemberEngagementScore } from './engagement';

export async function evaluateLeadershipAttentionSignals(memberId: string) {
  const member = await db.networkMember.findUnique({
    where: { id: memberId },
    include: { user: { include: { profile: true } } },
  });

  if (!member) throw new Error('Member not found.');

  const reasons: string[] = [];
  let highestRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';

  // 1. Overdue Training Check
  const overdueCount = await db.trainingAssignment.count({
    where: { assignedToMemberId: memberId, status: 'OVERDUE' },
  });

  if (overdueCount > 0) {
    reasons.push(`Member has ${overdueCount} overdue training assignment(s).`);
    highestRisk = 'MEDIUM';
  }

  // 2. Engagement Score Check
  const engagement = await calculateMemberEngagementScore(memberId);
  if (engagement.score < 30) {
    reasons.push(`Low community engagement score (${engagement.score}/100).`);
    if (highestRisk === 'LOW') highestRisk = 'MEDIUM';
    if (overdueCount > 0) highestRisk = 'HIGH';
  }

  // 3. Exited Warning Check
  if (member.status === 'AT_RISK' || member.status === 'EXITED') {
    reasons.push(`Member status is ${member.status}.`);
    highestRisk = 'CRITICAL';
  }

  if (reasons.length === 0) {
    // Resolve any active alerts
    await db.leadershipAttentionAlert.updateMany({
      where: { memberId, isResolved: false },
      data: { isResolved: true, resolvedAt: new Date() },
    });
    return null;
  }

  // Create or update attention alert
  const alert = await db.leadershipAttentionAlert.create({
    data: {
      memberId,
      alertType: overdueCount > 0 ? 'OVERDUE_TRAINING' : 'INACTIVITY',
      riskLevel: highestRisk,
      reasonsJson: JSON.stringify(reasons),
    },
  });

  await eventBus.publish('LeadershipAttentionTriggered', {
    alertId: alert.id,
    memberId,
    riskLevel: highestRisk,
    reasons,
  });

  return alert;
}

export async function getActiveLeadershipAttentionAlerts() {
  const alerts = await db.leadershipAttentionAlert.findMany({
    where: { isResolved: false },
    orderBy: { createdAt: 'desc' },
    include: {
      member: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
              profile: { select: { displayName: true, avatarUrl: true } },
            },
          },
        },
      },
    },
  });

  return alerts.map((a) => ({
    id: a.id,
    memberId: a.memberId,
    memberName: a.member.user.profile?.displayName || a.member.user.name || 'Member',
    memberCode: a.member.memberCode,
    alertType: a.alertType,
    riskLevel: a.riskLevel,
    reasons: JSON.parse(a.reasonsJson),
    createdAt: a.createdAt,
  }));
}

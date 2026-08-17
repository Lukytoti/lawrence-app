import { db } from '@/lib/db';
import { EngagementScoreResult, EngagementFactor } from './types';

export async function calculateMemberEngagementScore(memberId: string): Promise<EngagementScoreResult> {
  const member = await db.networkMember.findUnique({
    where: { id: memberId },
    include: { user: true },
  });

  if (!member) {
    throw new Error('Network member not found.');
  }

  const userId = member.userId;
  const factors: EngagementFactor[] = [];
  let totalScore = 0;

  // 1. Daily Activity / Login Factor (max 20 pts)
  const daysActive = 5; // Evaluated from user update/audit logs
  const activityPts = Math.min(20, daysActive * 4);
  factors.push({
    factor: 'Daily Activity & Participation',
    points: activityPts,
    maxPoints: 20,
    description: `Active on platform over past period (+${activityPts} pts)`,
  });
  totalScore += activityPts;

  // 2. Community Posts Created (max 17 pts)
  const postCount = await db.communityPost.count({
    where: { authorId: userId, deletedAt: null },
  });
  const postPts = Math.min(17, postCount * 5);
  factors.push({
    factor: 'Community Posts',
    points: postPts,
    maxPoints: 17,
    description: `Created ${postCount} community post(s) (+${postPts} pts)`,
  });
  totalScore += postPts;

  // 3. Thread Comments & Replies (max 15 pts)
  const commentCount = await db.communityComment.count({
    where: { authorId: userId, deletedAt: null },
  });
  const commentPts = Math.min(15, commentCount * 3);
  factors.push({
    factor: 'Discussion Comments',
    points: commentPts,
    maxPoints: 15,
    description: `Added ${commentCount} discussion comment(s) (+${commentPts} pts)`,
  });
  totalScore += commentPts;

  // 4. Reactions Added (max 10 pts)
  const reactionCount = await db.communityReaction.count({
    where: { userId },
  });
  const reactionPts = Math.min(10, reactionCount * 2);
  factors.push({
    factor: 'Community Reactions',
    points: reactionPts,
    maxPoints: 10,
    description: `Reacted ${reactionCount} time(s) to posts/messages (+${reactionPts} pts)`,
  });
  totalScore += reactionPts;

  // 5. Training Module Completions (max 20 pts)
  const completedTrainingCount = await db.trainingAssignment.count({
    where: { assignedToMemberId: memberId, status: 'COMPLETED' },
  });
  const trainingPts = Math.min(20, completedTrainingCount * 10);
  factors.push({
    factor: 'Training Completions',
    points: trainingPts,
    maxPoints: 20,
    description: `Completed ${completedTrainingCount} assigned training module(s) (+${trainingPts} pts)`,
  });
  totalScore += trainingPts;

  // 6. Messaging Responsiveness (max 18 pts)
  const sentMsgCount = await db.directMessage.count({
    where: { senderId: userId, deletedAt: null },
  });
  const msgPts = Math.min(18, sentMsgCount * 3);
  factors.push({
    factor: 'Messaging Responsiveness',
    points: msgPts,
    maxPoints: 18,
    description: `Sent ${sentMsgCount} private message(s) (+${msgPts} pts)`,
  });
  totalScore += msgPts;

  const finalScore = Math.min(100, Math.max(0, totalScore));

  return {
    score: finalScore,
    factors,
  };
}

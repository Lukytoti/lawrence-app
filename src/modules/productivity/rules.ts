import { DailyActivityItemPayload } from './types';

/**
 * Calculate completion percentage for a single activity instance based on measurement unit.
 */
export function calculateActivityCompletionPercent(
  completed: number,
  target: number,
  unit: string
): number {
  if (target <= 0) return 100;
  if (unit === 'BOOLEAN') {
    return completed >= 1 ? 100 : 0;
  }
  return Math.min(100, Math.round((completed / target) * 100));
}

/**
 * Calculate weighted daily productivity score breakdown.
 * Formula:
 * ActivityScore = 40%
 * GoalScore = 30%
 * TaskScore = 15%
 * EvidenceCompliance = 15%
 */
export function calculateDailyProductivityScore(
  activities: DailyActivityItemPayload[],
  goalsCompletionPct = 100,
  tasksCompletionPct = 100
): {
  activityScore: number;
  goalScore: number;
  taskScore: number;
  evidenceScore: number;
  overallScore: number;
} {
  if (activities.length === 0) {
    return {
      activityScore: 100,
      goalScore: goalsCompletionPct,
      taskScore: tasksCompletionPct,
      evidenceScore: 100,
      overallScore: 100,
    };
  }

  let totalWeightedProgress = 0;
  let totalWeight = 0;
  let requiredEvidenceCount = 0;
  let approvedEvidenceCount = 0;

  for (const act of activities) {
    const w = 1.0; // Default weight
    const pct = calculateActivityCompletionPercent(act.completedValue, act.targetValue, act.measurementUnit);
    totalWeightedProgress += pct * w;
    totalWeight += w;

    if (act.requiresEvidence) {
      requiredEvidenceCount++;
      if (act.evidenceItems.some((e) => e.status === 'APPROVED' || e.status === 'PENDING')) {
        approvedEvidenceCount++;
      }
    }
  }

  const activityScore = totalWeight > 0 ? Math.round(totalWeightedProgress / totalWeight) : 100;
  const evidenceScore = requiredEvidenceCount > 0 ? Math.round((approvedEvidenceCount / requiredEvidenceCount) * 100) : 100;
  const goalScore = Math.min(100, Math.max(0, goalsCompletionPct));
  const taskScore = Math.min(100, Math.max(0, tasksCompletionPct));

  const overallScore = Math.round(
    activityScore * 0.40 +
    goalScore * 0.30 +
    taskScore * 0.15 +
    evidenceScore * 0.15
  );

  return {
    activityScore,
    goalScore,
    taskScore,
    evidenceScore,
    overallScore,
  };
}

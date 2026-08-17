import { RequirementStatus, RankRequirementProgress } from './types';

export interface MemberVolumes {
  pv: number;
  ppv: number;
  qpv: number;
  bv: number;
  activeStatus: boolean;
  consecutiveQualifyingMonths?: number;
  qualifiedDirectorLegs?: number;
  groupPV?: number;
  highestAchievedLevel?: number;
}

export interface RawRequirement {
  id: string;
  requirementType: string;
  metric: string | null;
  threshold: number | null;
  comparisonOperator: string;
  periodType: string;
  periodCount: number;
  prerequisiteRankId?: string | null;
  description: string | null;
  isRequired: boolean;
  prerequisiteRankLevel?: number;
}

/**
 * Evaluate a single RankRequirement against member volumes & period metrics.
 */
export function evaluateRequirement(
  req: RawRequirement,
  volumes: MemberVolumes
): RankRequirementProgress {
  let threshold = req.threshold || 0;
  let currentValue = 0;
  let status: RequirementStatus = 'NOT_STARTED';

  if (req.requirementType === 'CONSECUTIVE_MONTHS') {
    threshold = req.periodCount || 3;
    const minQPV = req.threshold || 4000;
    currentValue = volumes.consecutiveQualifyingMonths || (volumes.qpv >= minQPV ? 1 : 0);
  } else if (req.requirementType === 'PREREQUISITE_RANK') {
    threshold = req.prerequisiteRankLevel || 3;
    currentValue = volumes.highestAchievedLevel || 0;
  } else {
    switch (req.metric) {
      case 'PPV':
        currentValue = volumes.ppv;
        break;
      case 'QPV':
        currentValue = volumes.qpv;
        break;
      case 'PV':
        currentValue = volumes.pv;
        break;
      case 'BV':
        currentValue = volumes.bv;
        break;
      case 'GROUP_PV':
        currentValue = volumes.groupPV || 0;
        break;
      case 'QUALIFIED_DIRECTOR_LEGS':
        currentValue = volumes.qualifiedDirectorLegs || 0;
        break;
      case 'ACTIVE_STATUS':
        currentValue = volumes.activeStatus ? 1 : 0;
        break;
      default:
        currentValue = volumes.qpv;
        break;
    }
  }

  const remainingValue = Math.max(0, threshold - currentValue);
  const progressPercent = threshold > 0 ? Math.min(100, Math.round((currentValue / threshold) * 100)) : 100;

  if (currentValue >= threshold) {
    status = 'COMPLETED';
  } else if (currentValue > 0) {
    status = 'IN_PROGRESS';
  } else {
    status = 'NOT_STARTED';
  }

  return {
    id: req.id,
    requirementType: req.requirementType,
    metric: req.metric || 'QPV',
    threshold,
    currentValue,
    remainingValue,
    progressPercent,
    status,
    description: req.description || `${req.metric || 'QPV'} requirement of ${threshold}`,
    isRequired: req.isRequired,
  };
}

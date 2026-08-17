import { RankRequirementProgress } from './types';

export interface QualificationExplanation {
  targetRankCode: string;
  targetRankName: string;
  isQualified: boolean;
  summary: string;
  requirementDetails: {
    metric: string;
    description: string;
    target: number | string;
    actual: number | string;
    remaining: number | string;
    status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED';
  }[];
}

/**
 * Generate structured human-readable explanation breakdown for rank qualification status.
 */
export function generateQualificationExplanation(
  targetRankName: string,
  targetRankCode: string,
  isQualified: boolean,
  requirements: RankRequirementProgress[]
): QualificationExplanation {
  const details = requirements.map((req) => ({
    metric: req.metric,
    description: req.description,
    target: req.threshold,
    actual: req.currentValue,
    remaining: req.remainingValue,
    status: req.status === 'COMPLETED' ? ('COMPLETED' as const) : ('FAILED' as const),
  }));

  const failedReqs = requirements.filter((r) => r.status !== 'COMPLETED' && r.isRequired);

  let summary = `${targetRankName} Qualification COMPLETED. All requirements met.`;

  if (!isQualified && failedReqs.length > 0) {
    const mainFailure = failedReqs[0];
    if (mainFailure.requirementType === 'PREREQUISITE_RANK') {
      summary = `${targetRankName} Qualification FAILED: Prerequisite Executive Manager achievement required.`;
    } else if (mainFailure.requirementType === 'PPV_THRESHOLD') {
      summary = `${targetRankName} Qualification FAILED: Active Personal Point Value (PPV) is below 100 threshold (${mainFailure.currentValue} / ${mainFailure.threshold}).`;
    } else if (mainFailure.requirementType === 'QPV_THRESHOLD') {
      summary = `${targetRankName} Qualification FAILED: Missing ${mainFailure.remainingValue.toLocaleString()} QPV (${mainFailure.currentValue.toLocaleString()} / ${mainFailure.threshold.toLocaleString()}).`;
    } else if (mainFailure.requirementType === 'QD_LEGS_THRESHOLD') {
      summary = `${targetRankName} Qualification FAILED: Requires ${mainFailure.threshold} Qualified Director legs (Current: ${mainFailure.currentValue}).`;
    } else if (mainFailure.requirementType === 'GROUP_PV_THRESHOLD') {
      summary = `${targetRankName} Qualification FAILED: Requires ${mainFailure.threshold.toLocaleString()} Group PV (Current: ${mainFailure.currentValue.toLocaleString()}).`;
    } else {
      summary = `${targetRankName} Qualification FAILED: Missing ${mainFailure.description}.`;
    }
  }

  return {
    targetRankCode,
    targetRankName,
    isQualified,
    summary,
    requirementDetails: details,
  };
}

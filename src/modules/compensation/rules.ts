import { RuleEvaluationResult } from './types';

export function evaluateSVBRule(
  memberQual: any,
  svbRates: any[],
  rule: any
): RuleEvaluationResult {
  const qpv = Number(memberQual.qpv || 0);
  const bv = Number(memberQual.bv || memberQual.qpv || 0);

  // 1. Resolve rate from SVBRateConfig table (Prompt 03A/03B rate resolution authority)
  const applicableRateObj = svbRates.find((rate) => {
    const min = Number(rate.minQPV);
    const max = rate.maxQPV ? Number(rate.maxQPV) : Infinity;
    return qpv >= min && qpv <= max;
  });

  const ratePercent = applicableRateObj ? Number(applicableRateObj.ratePercent) : 0;
  const rateRef = `${ratePercent}% (QPV Tier ${applicableRateObj ? `${applicableRateObj.minQPV} - ${applicableRateObj.maxQPV || 'Above'}` : 'Below Minimum'})`;

  // 2. Check if Rule status is ACTIVE and explicit monetary formula base is configured
  let config: any = {};
  try {
    config = rule?.configurationJson ? JSON.parse(rule.configurationJson) : {};
  } catch (e) {
    config = {};
  }

  const isRuleConfigured = rule?.status === 'ACTIVE' && Boolean(config.monetaryFormulaBase);

  if (!isRuleConfigured || ratePercent === 0) {
    return {
      ruleId: rule?.id || 'UNCONFIGURED_SVB',
      ruleCode: rule?.code || 'SVB_RULES',
      category: 'SVB',
      calculatedAmount: 0,
      baseAmount: bv,
      rateOrFormulaRef: rateRef,
      eligibilityStatus: 'UNCONFIGURED',
      explanation: `SVB rate resolved at ${ratePercent}%, but monetary formula base is UNCONFIGURED. Zero payout calculated.`,
      warning: 'Monetary SVB calculation base is UNCONFIGURED. Ledger posting skipped.',
    };
  }

  // 3. Apply formula base: e.g. BV base or QPV base
  const baseVolume = config.monetaryFormulaBase === 'BV' ? bv : qpv;
  const calculatedAmount = Number(((baseVolume * ratePercent) / 100).toFixed(4));

  return {
    ruleId: rule.id,
    ruleCode: rule.code,
    category: 'SVB',
    calculatedAmount,
    baseAmount: baseVolume,
    rateOrFormulaRef: rateRef,
    eligibilityStatus: 'QUALIFIED',
    explanation: `Active status satisfied. Qualified QPV ${qpv} resolved to ${ratePercent}% SVB tier applied against ${config.monetaryFormulaBase} (${baseVolume}). Earning = ${calculatedAmount} NGN.`,
  };
}

export function evaluateLDBRule(
  memberQual: any,
  rule: any,
  downlineMemberId?: string
): RuleEvaluationResult {
  const isConfigured = rule?.status === 'ACTIVE' && rule?.configurationJson;

  if (!isConfigured) {
    return {
      ruleId: rule?.id || 'UNCONFIGURED_LDB',
      ruleCode: rule?.code || 'LDB_RULES',
      category: 'LDB',
      calculatedAmount: 0,
      baseAmount: 0,
      rateOrFormulaRef: 'UNCONFIGURED (LDB Rule Deferred)',
      eligibilityStatus: 'UNCONFIGURED',
      explanation: 'Leadership Development Bonus (LDB) formula is UNCONFIGURED. Zero payout calculated.',
      sourceMemberId: downlineMemberId,
      warning: 'LDB rule is UNCONFIGURED. Financial posting skipped.',
    };
  }

  return {
    ruleId: rule.id,
    ruleCode: rule.code,
    category: 'LDB',
    calculatedAmount: 0,
    baseAmount: 0,
    rateOrFormulaRef: 'Configured LDB',
    eligibilityStatus: 'UNCONFIGURED',
    explanation: 'Configured LDB rule evaluated.',
    sourceMemberId: downlineMemberId,
  };
}

export function evaluateNDBRule(
  memberQual: any,
  rule: any,
  downlineMemberId?: string
): RuleEvaluationResult {
  const isConfigured = rule?.status === 'ACTIVE' && rule?.configurationJson;

  if (!isConfigured) {
    return {
      ruleId: rule?.id || 'UNCONFIGURED_NDB',
      ruleCode: rule?.code || 'NDB_RULES',
      category: 'NDB',
      calculatedAmount: 0,
      baseAmount: 0,
      rateOrFormulaRef: 'UNCONFIGURED (NDB Rule Deferred)',
      eligibilityStatus: 'UNCONFIGURED',
      explanation: 'Network Development Bonus (NDB) formula is UNCONFIGURED. Zero payout calculated.',
      sourceMemberId: downlineMemberId,
      warning: 'NDB rule is UNCONFIGURED. Financial posting skipped.',
    };
  }

  return {
    ruleId: rule.id,
    ruleCode: rule.code,
    category: 'NDB',
    calculatedAmount: 0,
    baseAmount: 0,
    rateOrFormulaRef: 'Configured NDB',
    eligibilityStatus: 'UNCONFIGURED',
    explanation: 'Configured NDB rule evaluated.',
    sourceMemberId: downlineMemberId,
  };
}

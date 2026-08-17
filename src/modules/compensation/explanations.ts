import { MemberCompensationCalculationResult } from './types';

export function generateCompensationExplanation(result: MemberCompensationCalculationResult): string {
  const lines: string[] = [];
  lines.push(`Member ID: ${result.memberId}`);
  lines.push(`Achieved Rank: ${result.achievedRankCode} | Qualified Rank: ${result.qualifiedRankCode}`);
  lines.push(`Qualifying Metrics — QPV: ${result.qualifyingQPV.toLocaleString()}, PPV: ${result.qualifyingPPV.toLocaleString()}`);
  lines.push('--- Itemized Earnings Breakdown ---');

  for (const line of result.earningLines) {
    lines.push(
      `[${line.category}] Status: ${line.eligibilityStatus} | Base: ${line.baseAmount} NGN | Rate: ${line.rateOrFormulaRef} | Calculated: ${line.calculatedAmount} ${result.currency}`
    );
    lines.push(`   Explanation: ${line.explanation}`);
    if (line.warning) {
      lines.push(`   [WARNING]: ${line.warning}`);
    }
  }

  lines.push('--- Summary Totals ---');
  lines.push(`Gross Calculated Earnings: ${result.grossCalculatedAmount.toLocaleString()} ${result.currency}`);
  lines.push(`Adjustments: ${result.adjustmentsAmount.toLocaleString()} ${result.currency}`);
  lines.push(`Final Payable Amount: ${result.finalPayableAmount.toLocaleString()} ${result.currency}`);

  return lines.join('\n');
}

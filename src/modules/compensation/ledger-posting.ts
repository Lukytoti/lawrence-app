import { db } from '@/lib/db';
import { eventBus } from '@/lib/events';
import { postEarning } from '@/modules/finance/service';

export async function postCompensationRunToLedger(runId: string, posterUserId: string) {
  const run = await db.compensationRun.findUnique({
    where: { id: runId },
    include: {
      period: true,
      planVersion: true,
      memberResults: {
        where: { status: { in: ['CALCULATED', 'APPROVED', 'POSTED'] } },
        include: { member: { include: { user: true } }, earningLines: true },
      },
    },
  });

  if (!run) {
    throw new Error('Compensation run not found.');
  }

  // Idempotent return for already POSTED run
  if (run.status === 'POSTED') {
    return run;
  }

  if (run.status !== 'APPROVED' && run.status !== 'POSTING') {
    throw new Error(`Cannot post compensation run with status '${run.status}'. Run must be APPROVED before posting to double-entry ledger.`);
  }

  // Update run status to POSTING
  await db.compensationRun.update({
    where: { id: runId },
    data: { status: 'POSTING' },
  });

  let postedCount = 0;
  let totalPostedAmount = 0;

  for (const result of run.memberResults) {
    const payableAmount = Number(result.finalPayableAmount);

    // Skip zero or negative payable amounts (e.g. UNCONFIGURED rules)
    if (payableAmount <= 0) {
      await db.memberCompensationResult.update({
        where: { id: result.id },
        data: { status: 'POSTED' },
      });
      continue;
    }

    // Idempotency check: verify result hasn't already been posted
    if (result.postedTransactionId) {
      continue;
    }

    // Deterministic transaction reference number
    const referenceNo = `COMP-${run.period.year}-${String(run.period.month).padStart(2, '0')}-${result.memberId}`;

    // Check if JournalTransaction with referenceNo already exists in Prompt 05 ledger
    const existingTxn = await db.journalTransaction.findFirst({
      where: { referenceNo },
    });

    if (existingTxn) {
      await db.memberCompensationResult.update({
        where: { id: result.id },
        data: { status: 'POSTED', postedTransactionId: existingTxn.id },
      });
      continue;
    }

    // Post to Prompt 05 double-entry ledger using postEarning helper
    const postedTxn = await postEarning({
      memberId: result.memberId,
      domain: 'NETWORK_MARKETING',
      earningType: 'NETWORK_SVB',
      amount: payableAmount,
      currency: result.currency,
      sourceEntityId: referenceNo,
      description: `NeoLife Compensation Payout ${run.period.year}/${run.period.month} (${result.qualifiedRankCode})`,
      createdBy: posterUserId,
    });

    // Update MemberCompensationResult with posted transaction reference
    await db.memberCompensationResult.update({
      where: { id: result.id },
      data: {
        status: 'POSTED',
        postedTransactionId: postedTxn.id,
      },
    });

    await eventBus.publish('EarningPosted', {
      resultId: result.id,
      memberId: result.memberId,
      amount: payableAmount,
      currency: result.currency,
      transactionId: postedTxn.id,
    }, posterUserId);

    postedCount++;
    totalPostedAmount += payableAmount;
  }

  // Finalize run as POSTED
  const updatedRun = await db.compensationRun.update({
    where: { id: runId },
    data: {
      status: 'POSTED',
      postedById: posterUserId,
      postedAt: new Date(),
    },
  });

  await db.auditLog.create({
    data: {
      actorId: posterUserId,
      action: 'COMPENSATION_POSTED',
      entityType: 'CompensationRun',
      entityId: runId,
      metadata: JSON.stringify({
        postedCount,
        totalPostedAmount,
        currency: run.currency,
      }),
    },
  });

  await eventBus.publish('CompensationPosted', {
    runId,
    periodId: run.periodId,
    postedCount,
    totalPostedAmount,
  }, posterUserId);

  return updatedRun;
}

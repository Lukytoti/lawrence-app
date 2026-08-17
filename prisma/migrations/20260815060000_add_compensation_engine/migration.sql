-- CreateTable
CREATE TABLE "CompensationRule" (
    "id" TEXT NOT NULL,
    "planVersionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "priority" INTEGER NOT NULL DEFAULT 1,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "configurationJson" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompensationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompensationRun" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "planVersionId" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL DEFAULT 'NG',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "calculationVersion" TEXT NOT NULL DEFAULT 'v1.0.0',
    "totalMembersCount" INTEGER NOT NULL DEFAULT 0,
    "totalGrossAmount" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "initiatedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "postedById" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "postedAt" TIMESTAMP(3),
    "resultSummaryJson" TEXT,
    "errorSummaryJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompensationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberCompensationResult" (
    "id" TEXT NOT NULL,
    "compensationRunId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "planVersionId" TEXT NOT NULL,
    "achievedRankCode" TEXT NOT NULL,
    "qualifiedRankCode" TEXT NOT NULL,
    "qualifyingQPV" DECIMAL(14,2) NOT NULL,
    "qualifyingPPV" DECIMAL(14,2) NOT NULL,
    "grossCalculatedAmount" DECIMAL(18,4) NOT NULL,
    "adjustmentsAmount" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "finalPayableAmount" DECIMAL(18,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" TEXT NOT NULL DEFAULT 'CALCULATED',
    "postedTransactionId" TEXT,
    "explanationJson" TEXT,
    "snapshotJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberCompensationResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EarningLineItem" (
    "id" TEXT NOT NULL,
    "memberCompensationResultId" TEXT NOT NULL,
    "compensationRuleId" TEXT,
    "category" TEXT NOT NULL,
    "sourceMemberId" TEXT,
    "baseAmount" DECIMAL(18,4) NOT NULL,
    "rateOrFormulaRef" TEXT NOT NULL,
    "calculatedAmount" DECIMAL(18,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "eligibilityStatus" TEXT NOT NULL DEFAULT 'QUALIFIED',
    "explanationJson" TEXT,
    "snapshotJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EarningLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompensationAdjustment" (
    "id" TEXT NOT NULL,
    "originalCompensationResultId" TEXT NOT NULL,
    "originalJournalTransactionId" TEXT,
    "journalTransactionId" TEXT,
    "adjustedAmount" DECIMAL(18,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "reason" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompensationAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompensationRule_planVersionId_code_key" ON "CompensationRule"("planVersionId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "CompensationRun_periodId_planVersionId_countryCode_key" ON "CompensationRun"("periodId", "planVersionId", "countryCode");

-- CreateIndex
CREATE UNIQUE INDEX "MemberCompensationResult_postedTransactionId_key" ON "MemberCompensationResult"("postedTransactionId");

-- CreateIndex
CREATE INDEX "MemberCompensationResult_memberId_periodId_idx" ON "MemberCompensationResult"("memberId", "periodId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberCompensationResult_compensationRunId_memberId_key" ON "MemberCompensationResult"("compensationRunId", "memberId");

-- CreateIndex
CREATE INDEX "EarningLineItem_memberCompensationResultId_category_idx" ON "EarningLineItem"("memberCompensationResultId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "CompensationAdjustment_journalTransactionId_key" ON "CompensationAdjustment"("journalTransactionId");

-- AddForeignKey
ALTER TABLE "CompensationRule" ADD CONSTRAINT "CompensationRule_planVersionId_fkey" FOREIGN KEY ("planVersionId") REFERENCES "PlanVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompensationRun" ADD CONSTRAINT "CompensationRun_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "QualificationPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompensationRun" ADD CONSTRAINT "CompensationRun_planVersionId_fkey" FOREIGN KEY ("planVersionId") REFERENCES "PlanVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompensationRun" ADD CONSTRAINT "CompensationRun_initiatedById_fkey" FOREIGN KEY ("initiatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompensationRun" ADD CONSTRAINT "CompensationRun_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompensationRun" ADD CONSTRAINT "CompensationRun_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberCompensationResult" ADD CONSTRAINT "MemberCompensationResult_compensationRunId_fkey" FOREIGN KEY ("compensationRunId") REFERENCES "CompensationRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberCompensationResult" ADD CONSTRAINT "MemberCompensationResult_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "NetworkMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberCompensationResult" ADD CONSTRAINT "MemberCompensationResult_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "QualificationPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberCompensationResult" ADD CONSTRAINT "MemberCompensationResult_planVersionId_fkey" FOREIGN KEY ("planVersionId") REFERENCES "PlanVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberCompensationResult" ADD CONSTRAINT "MemberCompensationResult_postedTransactionId_fkey" FOREIGN KEY ("postedTransactionId") REFERENCES "JournalTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EarningLineItem" ADD CONSTRAINT "EarningLineItem_memberCompensationResultId_fkey" FOREIGN KEY ("memberCompensationResultId") REFERENCES "MemberCompensationResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EarningLineItem" ADD CONSTRAINT "EarningLineItem_compensationRuleId_fkey" FOREIGN KEY ("compensationRuleId") REFERENCES "CompensationRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EarningLineItem" ADD CONSTRAINT "EarningLineItem_sourceMemberId_fkey" FOREIGN KEY ("sourceMemberId") REFERENCES "NetworkMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompensationAdjustment" ADD CONSTRAINT "CompensationAdjustment_originalCompensationResultId_fkey" FOREIGN KEY ("originalCompensationResultId") REFERENCES "MemberCompensationResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompensationAdjustment" ADD CONSTRAINT "CompensationAdjustment_originalJournalTransactionId_fkey" FOREIGN KEY ("originalJournalTransactionId") REFERENCES "JournalTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompensationAdjustment" ADD CONSTRAINT "CompensationAdjustment_journalTransactionId_fkey" FOREIGN KEY ("journalTransactionId") REFERENCES "JournalTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompensationAdjustment" ADD CONSTRAINT "CompensationAdjustment_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "CompensationPlan" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'NG',
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompensationPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanVersion" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "versionName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rank" (
    "id" TEXT NOT NULL,
    "planVersionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'DISTRIBUTOR_FAMILY',
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankRequirement" (
    "id" TEXT NOT NULL,
    "rankId" TEXT NOT NULL,
    "requirementType" TEXT NOT NULL,
    "metric" TEXT,
    "threshold" DECIMAL(14,2),
    "comparisonOperator" TEXT NOT NULL DEFAULT 'GTE',
    "periodType" TEXT NOT NULL DEFAULT 'MONTHLY',
    "periodCount" INTEGER NOT NULL DEFAULT 1,
    "prerequisiteRankId" TEXT,
    "configurationJson" TEXT,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RankRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SVBRateConfig" (
    "id" TEXT NOT NULL,
    "planVersionId" TEXT NOT NULL,
    "minQPV" DECIMAL(14,2) NOT NULL,
    "maxQPV" DECIMAL(14,2),
    "ratePercent" DECIMAL(5,2) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SVBRateConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualificationPeriod" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QualificationPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberQualification" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "planVersionId" TEXT NOT NULL,
    "achievedRankId" TEXT NOT NULL,
    "qualifiedRankId" TEXT NOT NULL,
    "pv" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "ppv" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "qpv" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "bv" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "svbRatePercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "activeStatus" BOOLEAN NOT NULL DEFAULT true,
    "qualifiedStatus" TEXT NOT NULL DEFAULT 'QUALIFIED',
    "qualificationResultJson" TEXT,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberQualification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankHistory" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "rankId" TEXT NOT NULL,
    "achievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'SYSTEM_EVALUATION',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RankHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rank_planVersionId_code_key" ON "Rank"("planVersionId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Rank_planVersionId_level_key" ON "Rank"("planVersionId", "level");

-- CreateIndex
CREATE UNIQUE INDEX "QualificationPeriod_year_month_key" ON "QualificationPeriod"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "MemberQualification_memberId_periodId_key" ON "MemberQualification"("memberId", "periodId");

-- AddForeignKey
ALTER TABLE "PlanVersion" ADD CONSTRAINT "PlanVersion_planId_fkey" FOREIGN KEY ("planId") REFERENCES "CompensationPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rank" ADD CONSTRAINT "Rank_planVersionId_fkey" FOREIGN KEY ("planVersionId") REFERENCES "PlanVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankRequirement" ADD CONSTRAINT "RankRequirement_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "Rank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankRequirement" ADD CONSTRAINT "RankRequirement_prerequisiteRankId_fkey" FOREIGN KEY ("prerequisiteRankId") REFERENCES "Rank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SVBRateConfig" ADD CONSTRAINT "SVBRateConfig_planVersionId_fkey" FOREIGN KEY ("planVersionId") REFERENCES "PlanVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberQualification" ADD CONSTRAINT "MemberQualification_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "NetworkMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberQualification" ADD CONSTRAINT "MemberQualification_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "QualificationPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberQualification" ADD CONSTRAINT "MemberQualification_planVersionId_fkey" FOREIGN KEY ("planVersionId") REFERENCES "PlanVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberQualification" ADD CONSTRAINT "MemberQualification_achievedRankId_fkey" FOREIGN KEY ("achievedRankId") REFERENCES "Rank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberQualification" ADD CONSTRAINT "MemberQualification_qualifiedRankId_fkey" FOREIGN KEY ("qualifiedRankId") REFERENCES "Rank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankHistory" ADD CONSTRAINT "RankHistory_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "NetworkMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankHistory" ADD CONSTRAINT "RankHistory_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "Rank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

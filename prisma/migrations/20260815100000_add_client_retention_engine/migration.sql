-- CreateTable
CREATE TABLE "ClientHealthSnapshot" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "healthStatus" TEXT NOT NULL DEFAULT 'HEALTHY',
    "healthScore" INTEGER NOT NULL DEFAULT 100,
    "scoreFactors" TEXT NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceVersion" TEXT NOT NULL DEFAULT 'v1.0',

    CONSTRAINT "ClientHealthSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientRetentionCase" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "reason" TEXT NOT NULL,
    "detectedSignals" TEXT,
    "assignedOwnerId" TEXT,
    "actionPlan" TEXT,
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientRetentionCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientRenewal" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "expirationWindowDays" INTEGER NOT NULL DEFAULT 30,
    "targetRenewalDate" TIMESTAMP(3) NOT NULL,
    "proposedValue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "assignedOwnerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "notes" TEXT,
    "renewedContractId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientRenewal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientExpansionOpportunity" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "serviceCategory" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "estimatedValue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "crmOpportunityId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IDENTIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientExpansionOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientTouchpoint" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'CHECK_IN',
    "summary" TEXT NOT NULL,
    "notes" TEXT,
    "performedById" TEXT NOT NULL,
    "interactionId" TEXT,
    "contactedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientTouchpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientRiskSignal" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "signalType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "description" TEXT NOT NULL,
    "sourceDomain" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "ClientRiskSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientSuccessPlan" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "clientObjectives" TEXT NOT NULL,
    "successMilestones" TEXT NOT NULL,
    "expectedOutcomes" TEXT,
    "reviewDate" TIMESTAMP(3),
    "ownerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientSuccessPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientHealthSnapshot_clientId_calculatedAt_idx" ON "ClientHealthSnapshot"("clientId", "calculatedAt");
CREATE INDEX "ClientHealthSnapshot_healthStatus_idx" ON "ClientHealthSnapshot"("healthStatus");

-- CreateIndex
CREATE INDEX "ClientRetentionCase_clientId_idx" ON "ClientRetentionCase"("clientId");
CREATE INDEX "ClientRetentionCase_status_idx" ON "ClientRetentionCase"("status");
CREATE INDEX "ClientRetentionCase_assignedOwnerId_idx" ON "ClientRetentionCase"("assignedOwnerId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientRenewal_renewedContractId_key" ON "ClientRenewal"("renewedContractId");
CREATE INDEX "ClientRenewal_clientId_idx" ON "ClientRenewal"("clientId");
CREATE INDEX "ClientRenewal_contractId_idx" ON "ClientRenewal"("contractId");
CREATE INDEX "ClientRenewal_status_targetRenewalDate_idx" ON "ClientRenewal"("status", "targetRenewalDate");

-- CreateIndex
CREATE INDEX "ClientExpansionOpportunity_clientId_idx" ON "ClientExpansionOpportunity"("clientId");
CREATE INDEX "ClientExpansionOpportunity_status_idx" ON "ClientExpansionOpportunity"("status");

-- CreateIndex
CREATE INDEX "ClientTouchpoint_clientId_idx" ON "ClientTouchpoint"("clientId");
CREATE INDEX "ClientTouchpoint_type_idx" ON "ClientTouchpoint"("type");

-- CreateIndex
CREATE INDEX "ClientRiskSignal_clientId_status_idx" ON "ClientRiskSignal"("clientId", "status");
CREATE INDEX "ClientRiskSignal_signalType_idx" ON "ClientRiskSignal"("signalType");

-- CreateIndex
CREATE INDEX "ClientSuccessPlan_clientId_idx" ON "ClientSuccessPlan"("clientId");
CREATE INDEX "ClientSuccessPlan_status_idx" ON "ClientSuccessPlan"("status");

-- AddForeignKey
ALTER TABLE "ClientHealthSnapshot" ADD CONSTRAINT "ClientHealthSnapshot_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "DigitalClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientRetentionCase" ADD CONSTRAINT "ClientRetentionCase_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "DigitalClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientRetentionCase" ADD CONSTRAINT "ClientRetentionCase_assignedOwnerId_fkey" FOREIGN KEY ("assignedOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientRenewal" ADD CONSTRAINT "ClientRenewal_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "DigitalClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientRenewal" ADD CONSTRAINT "ClientRenewal_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "ClientContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientRenewal" ADD CONSTRAINT "ClientRenewal_assignedOwnerId_fkey" FOREIGN KEY ("assignedOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientExpansionOpportunity" ADD CONSTRAINT "ClientExpansionOpportunity_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "DigitalClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientTouchpoint" ADD CONSTRAINT "ClientTouchpoint_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "DigitalClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientTouchpoint" ADD CONSTRAINT "ClientTouchpoint_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientRiskSignal" ADD CONSTRAINT "ClientRiskSignal_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "DigitalClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientSuccessPlan" ADD CONSTRAINT "ClientSuccessPlan_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "DigitalClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientSuccessPlan" ADD CONSTRAINT "ClientSuccessPlan_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

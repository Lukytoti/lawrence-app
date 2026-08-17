-- CreateTable
CREATE TABLE "ResiliencePolicy" (
    "id" TEXT NOT NULL,
    "policyCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scope" TEXT NOT NULL,
    "rpoMinutes" INTEGER NOT NULL,
    "rtoMinutes" INTEGER NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "criticality" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResiliencePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupPlan" (
    "id" TEXT NOT NULL,
    "planCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "backupType" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "retentionDays" INTEGER NOT NULL DEFAULT 30,
    "storageReference" TEXT,
    "encryptionRequired" BOOLEAN NOT NULL DEFAULT true,
    "verificationRequired" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSuccessfulBackupAt" TIMESTAMP(3),
    "lastFailedBackupAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackupPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupExecution" (
    "id" TEXT NOT NULL,
    "executionCode" TEXT NOT NULL,
    "backupPlanId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "sizeBytes" BIGINT,
    "checksum" TEXT,
    "storageReference" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "correlationId" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackupExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoveryPlan" (
    "id" TEXT NOT NULL,
    "planCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scope" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "targetRpoMinutes" INTEGER NOT NULL,
    "targetRtoMinutes" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "lastTestedAt" TIMESTAMP(3),
    "lastSuccessfulTestAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecoveryPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoveryStep" (
    "id" TEXT NOT NULL,
    "recoveryPlanId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "stepType" TEXT NOT NULL,
    "commandReference" TEXT,
    "dependencyJson" TEXT,
    "timeoutSeconds" INTEGER NOT NULL DEFAULT 300,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecoveryStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoveryExecution" (
    "id" TEXT NOT NULL,
    "executionCode" TEXT NOT NULL,
    "recoveryPlanId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "triggerType" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "initiatedById" TEXT,
    "currentStep" INTEGER,
    "errorMessage" TEXT,
    "correlationId" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecoveryExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoveryStepExecution" (
    "id" TEXT NOT NULL,
    "recoveryExecutionId" TEXT NOT NULL,
    "recoveryStepId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "outputSummary" TEXT,
    "errorMessage" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecoveryStepExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResilienceDependency" (
    "id" TEXT NOT NULL,
    "dependencyCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "dependencyType" TEXT NOT NULL,
    "criticality" TEXT NOT NULL,
    "healthCheckReference" TEXT,
    "fallbackStrategy" TEXT,
    "rpoMinutes" INTEGER,
    "rtoMinutes" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResilienceDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContinuityPlan" (
    "id" TEXT NOT NULL,
    "planCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "businessFunction" TEXT NOT NULL,
    "criticality" TEXT NOT NULL,
    "minimumOperatingLevel" TEXT,
    "maximumTolerableDowntimeMinutes" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "ownerId" TEXT,
    "lastReviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContinuityPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContinuityProcedure" (
    "id" TEXT NOT NULL,
    "continuityPlanId" TEXT NOT NULL,
    "procedureCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "description" TEXT,
    "responsibleRole" TEXT,
    "dependencyJson" TEXT,
    "fallbackAction" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContinuityProcedure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResilienceIncident" (
    "id" TEXT NOT NULL,
    "incidentCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "source" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "recoveryExecutionId" TEXT,
    "rootCause" TEXT,
    "impactSummary" TEXT,
    "correlationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResilienceIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoveryAuditLog" (
    "id" TEXT NOT NULL,
    "eventCode" TEXT NOT NULL,
    "recoveryPlanId" TEXT,
    "backupExecutionId" TEXT,
    "recoveryExecutionId" TEXT,
    "incidentId" TEXT,
    "eventType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadataJson" TEXT,
    "correlationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecoveryAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResiliencePolicy_policyCode_key" ON "ResiliencePolicy"("policyCode");

-- CreateIndex
CREATE INDEX "ResiliencePolicy_isActive_idx" ON "ResiliencePolicy"("isActive");

-- CreateIndex
CREATE INDEX "ResiliencePolicy_criticality_idx" ON "ResiliencePolicy"("criticality");

-- CreateIndex
CREATE INDEX "ResiliencePolicy_scope_idx" ON "ResiliencePolicy"("scope");

-- CreateIndex
CREATE UNIQUE INDEX "BackupPlan_planCode_key" ON "BackupPlan"("planCode");

-- CreateIndex
CREATE INDEX "BackupPlan_isActive_idx" ON "BackupPlan"("isActive");

-- CreateIndex
CREATE INDEX "BackupPlan_backupType_idx" ON "BackupPlan"("backupType");

-- CreateIndex
CREATE UNIQUE INDEX "BackupExecution_executionCode_key" ON "BackupExecution"("executionCode");

-- CreateIndex
CREATE INDEX "BackupExecution_backupPlanId_idx" ON "BackupExecution"("backupPlanId");

-- CreateIndex
CREATE INDEX "BackupExecution_status_idx" ON "BackupExecution"("status");

-- CreateIndex
CREATE INDEX "BackupExecution_startedAt_idx" ON "BackupExecution"("startedAt");

-- CreateIndex
CREATE INDEX "BackupExecution_correlationId_idx" ON "BackupExecution"("correlationId");

-- CreateIndex
CREATE UNIQUE INDEX "RecoveryPlan_planCode_key" ON "RecoveryPlan"("planCode");

-- CreateIndex
CREATE INDEX "RecoveryPlan_status_idx" ON "RecoveryPlan"("status");

-- CreateIndex
CREATE INDEX "RecoveryPlan_priority_idx" ON "RecoveryPlan"("priority");

-- CreateIndex
CREATE INDEX "RecoveryStep_recoveryPlanId_idx" ON "RecoveryStep"("recoveryPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "RecoveryStep_recoveryPlanId_stepNumber_key" ON "RecoveryStep"("recoveryPlanId", "stepNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RecoveryExecution_executionCode_key" ON "RecoveryExecution"("executionCode");

-- CreateIndex
CREATE INDEX "RecoveryExecution_recoveryPlanId_idx" ON "RecoveryExecution"("recoveryPlanId");

-- CreateIndex
CREATE INDEX "RecoveryExecution_status_idx" ON "RecoveryExecution"("status");

-- CreateIndex
CREATE INDEX "RecoveryExecution_startedAt_idx" ON "RecoveryExecution"("startedAt");

-- CreateIndex
CREATE INDEX "RecoveryExecution_correlationId_idx" ON "RecoveryExecution"("correlationId");

-- CreateIndex
CREATE INDEX "RecoveryStepExecution_recoveryExecutionId_idx" ON "RecoveryStepExecution"("recoveryExecutionId");

-- CreateIndex
CREATE INDEX "RecoveryStepExecution_recoveryStepId_idx" ON "RecoveryStepExecution"("recoveryStepId");

-- CreateIndex
CREATE INDEX "RecoveryStepExecution_status_idx" ON "RecoveryStepExecution"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RecoveryStepExecution_recoveryExecutionId_recoveryStepId_key" ON "RecoveryStepExecution"("recoveryExecutionId", "recoveryStepId");

-- CreateIndex
CREATE UNIQUE INDEX "ResilienceDependency_dependencyCode_key" ON "ResilienceDependency"("dependencyCode");

-- CreateIndex
CREATE INDEX "ResilienceDependency_dependencyType_idx" ON "ResilienceDependency"("dependencyType");

-- CreateIndex
CREATE INDEX "ResilienceDependency_criticality_idx" ON "ResilienceDependency"("criticality");

-- CreateIndex
CREATE INDEX "ResilienceDependency_isActive_idx" ON "ResilienceDependency"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ContinuityPlan_planCode_key" ON "ContinuityPlan"("planCode");

-- CreateIndex
CREATE INDEX "ContinuityPlan_status_idx" ON "ContinuityPlan"("status");

-- CreateIndex
CREATE INDEX "ContinuityPlan_criticality_idx" ON "ContinuityPlan"("criticality");

-- CreateIndex
CREATE INDEX "ContinuityPlan_businessFunction_idx" ON "ContinuityPlan"("businessFunction");

-- CreateIndex
CREATE UNIQUE INDEX "ContinuityProcedure_procedureCode_key" ON "ContinuityProcedure"("procedureCode");

-- CreateIndex
CREATE INDEX "ContinuityProcedure_continuityPlanId_idx" ON "ContinuityProcedure"("continuityPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "ContinuityProcedure_continuityPlanId_sequence_key" ON "ContinuityProcedure"("continuityPlanId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "ResilienceIncident_incidentCode_key" ON "ResilienceIncident"("incidentCode");

-- CreateIndex
CREATE INDEX "ResilienceIncident_status_idx" ON "ResilienceIncident"("status");

-- CreateIndex
CREATE INDEX "ResilienceIncident_severity_idx" ON "ResilienceIncident"("severity");

-- CreateIndex
CREATE INDEX "ResilienceIncident_source_idx" ON "ResilienceIncident"("source");

-- CreateIndex
CREATE INDEX "ResilienceIncident_detectedAt_idx" ON "ResilienceIncident"("detectedAt");

-- CreateIndex
CREATE INDEX "ResilienceIncident_correlationId_idx" ON "ResilienceIncident"("correlationId");

-- CreateIndex
CREATE UNIQUE INDEX "RecoveryAuditLog_eventCode_key" ON "RecoveryAuditLog"("eventCode");

-- CreateIndex
CREATE INDEX "RecoveryAuditLog_eventType_idx" ON "RecoveryAuditLog"("eventType");

-- CreateIndex
CREATE INDEX "RecoveryAuditLog_recoveryPlanId_idx" ON "RecoveryAuditLog"("recoveryPlanId");

-- CreateIndex
CREATE INDEX "RecoveryAuditLog_backupExecutionId_idx" ON "RecoveryAuditLog"("backupExecutionId");

-- CreateIndex
CREATE INDEX "RecoveryAuditLog_recoveryExecutionId_idx" ON "RecoveryAuditLog"("recoveryExecutionId");

-- CreateIndex
CREATE INDEX "RecoveryAuditLog_incidentId_idx" ON "RecoveryAuditLog"("incidentId");

-- CreateIndex
CREATE INDEX "RecoveryAuditLog_correlationId_idx" ON "RecoveryAuditLog"("correlationId");

-- CreateIndex
CREATE INDEX "RecoveryAuditLog_createdAt_idx" ON "RecoveryAuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "ResiliencePolicy" ADD CONSTRAINT "ResiliencePolicy_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupExecution" ADD CONSTRAINT "BackupExecution_backupPlanId_fkey" FOREIGN KEY ("backupPlanId") REFERENCES "BackupPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryPlan" ADD CONSTRAINT "RecoveryPlan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryStep" ADD CONSTRAINT "RecoveryStep_recoveryPlanId_fkey" FOREIGN KEY ("recoveryPlanId") REFERENCES "RecoveryPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryExecution" ADD CONSTRAINT "RecoveryExecution_recoveryPlanId_fkey" FOREIGN KEY ("recoveryPlanId") REFERENCES "RecoveryPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryExecution" ADD CONSTRAINT "RecoveryExecution_initiatedById_fkey" FOREIGN KEY ("initiatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryStepExecution" ADD CONSTRAINT "RecoveryStepExecution_recoveryExecutionId_fkey" FOREIGN KEY ("recoveryExecutionId") REFERENCES "RecoveryExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryStepExecution" ADD CONSTRAINT "RecoveryStepExecution_recoveryStepId_fkey" FOREIGN KEY ("recoveryStepId") REFERENCES "RecoveryStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContinuityPlan" ADD CONSTRAINT "ContinuityPlan_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContinuityProcedure" ADD CONSTRAINT "ContinuityProcedure_continuityPlanId_fkey" FOREIGN KEY ("continuityPlanId") REFERENCES "ContinuityPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

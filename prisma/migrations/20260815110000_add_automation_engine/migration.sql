-- CreateTable
CREATE TABLE "AutomationWorkflow" (
    "id" TEXT NOT NULL,
    "workflowCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "domain" TEXT NOT NULL DEFAULT 'CROSS_DOMAIN',
    "triggerType" TEXT NOT NULL DEFAULT 'EVENT',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationTrigger" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'EVENT',
    "configurationJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationTrigger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationStep" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "type" TEXT NOT NULL,
    "configurationJson" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationExecution" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "workflowVersion" INTEGER NOT NULL DEFAULT 1,
    "triggerType" TEXT NOT NULL DEFAULT 'EVENT',
    "triggerEvent" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "error" TEXT,
    "correlationId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationStepExecution" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "outputJson" TEXT,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationStepExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationSchedule" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "cronExpression" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Lagos',
    "nextRunAt" TIMESTAMP(3) NOT NULL,
    "lastRunAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationRule" (
    "id" TEXT NOT NULL,
    "ruleCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "conditionJson" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationExecutionLog" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "stepExecutionId" TEXT,
    "eventType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutomationExecutionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AutomationWorkflow_workflowCode_key" ON "AutomationWorkflow"("workflowCode");
CREATE INDEX "AutomationWorkflow_domain_idx" ON "AutomationWorkflow"("domain");
CREATE INDEX "AutomationWorkflow_isActive_idx" ON "AutomationWorkflow"("isActive");
CREATE INDEX "AutomationWorkflow_createdById_idx" ON "AutomationWorkflow"("createdById");

-- CreateIndex
CREATE INDEX "AutomationTrigger_workflowId_idx" ON "AutomationTrigger"("workflowId");
CREATE INDEX "AutomationTrigger_type_idx" ON "AutomationTrigger"("type");

-- CreateIndex
CREATE INDEX "AutomationStep_workflowId_sequence_idx" ON "AutomationStep"("workflowId", "sequence");
CREATE INDEX "AutomationStep_type_idx" ON "AutomationStep"("type");

-- CreateIndex
CREATE UNIQUE INDEX "AutomationExecution_idempotencyKey_key" ON "AutomationExecution"("idempotencyKey");
CREATE INDEX "AutomationExecution_workflowId_idx" ON "AutomationExecution"("workflowId");
CREATE INDEX "AutomationExecution_status_idx" ON "AutomationExecution"("status");
CREATE INDEX "AutomationExecution_createdAt_idx" ON "AutomationExecution"("createdAt");

-- CreateIndex
CREATE INDEX "AutomationStepExecution_executionId_idx" ON "AutomationStepExecution"("executionId");
CREATE INDEX "AutomationStepExecution_stepId_idx" ON "AutomationStepExecution"("stepId");
CREATE INDEX "AutomationStepExecution_status_idx" ON "AutomationStepExecution"("status");

-- CreateIndex
CREATE INDEX "AutomationSchedule_workflowId_idx" ON "AutomationSchedule"("workflowId");
CREATE INDEX "AutomationSchedule_isActive_nextRunAt_idx" ON "AutomationSchedule"("isActive", "nextRunAt");

-- CreateIndex
CREATE UNIQUE INDEX "AutomationRule_ruleCode_key" ON "AutomationRule"("ruleCode");
CREATE INDEX "AutomationRule_isActive_idx" ON "AutomationRule"("isActive");

-- CreateIndex
CREATE INDEX "AutomationExecutionLog_executionId_idx" ON "AutomationExecutionLog"("executionId");
CREATE INDEX "AutomationExecutionLog_stepExecutionId_idx" ON "AutomationExecutionLog"("stepExecutionId");
CREATE INDEX "AutomationExecutionLog_createdAt_idx" ON "AutomationExecutionLog"("createdAt");

-- AddForeignKey
ALTER TABLE "AutomationWorkflow" ADD CONSTRAINT "AutomationWorkflow_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationTrigger" ADD CONSTRAINT "AutomationTrigger_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "AutomationWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationStep" ADD CONSTRAINT "AutomationStep_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "AutomationWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationExecution" ADD CONSTRAINT "AutomationExecution_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "AutomationWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationStepExecution" ADD CONSTRAINT "AutomationStepExecution_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "AutomationExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AutomationStepExecution" ADD CONSTRAINT "AutomationStepExecution_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "AutomationStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationSchedule" ADD CONSTRAINT "AutomationSchedule_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "AutomationWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationExecutionLog" ADD CONSTRAINT "AutomationExecutionLog_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "AutomationExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AutomationExecutionLog" ADD CONSTRAINT "AutomationExecutionLog_stepExecutionId_fkey" FOREIGN KEY ("stepExecutionId") REFERENCES "AutomationStepExecution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

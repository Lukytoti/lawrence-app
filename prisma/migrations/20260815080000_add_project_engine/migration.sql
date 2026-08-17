-- CreateTable
CREATE TABLE "DigitalService" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'DIGITAL_MARKETING',
    "defaultDurationDays" INTEGER NOT NULL DEFAULT 14,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigitalService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalProject" (
    "id" TEXT NOT NULL,
    "projectCode" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "crmOpportunityId" TEXT,
    "serviceId" TEXT,
    "ownerId" TEXT NOT NULL,
    "projectManagerId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "startDate" TIMESTAMP(3),
    "targetEndDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "contractValue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigitalProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalMilestone" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigitalMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTask" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "milestoneId" TEXT,
    "assignedToId" TEXT,
    "taskId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "estimatedHours" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "actualHours" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectDeliverable" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "milestoneId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'FILE',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "evidenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectDeliverable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientReview" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "deliverableId" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "feedback" TEXT,
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectActivity" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'INTERNAL',
    "description" TEXT NOT NULL,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientPortalAccess" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastAccessAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientPortalAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTemplate" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "serviceId" TEXT,
    "estimatedDurationDays" INTEGER NOT NULL DEFAULT 30,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTemplateMilestone" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "dayOffset" INTEGER NOT NULL DEFAULT 7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectTemplateMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DigitalService_code_key" ON "DigitalService"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalProject_projectCode_key" ON "DigitalProject"("projectCode");
CREATE INDEX "DigitalProject_clientId_idx" ON "DigitalProject"("clientId");
CREATE INDEX "DigitalProject_ownerId_idx" ON "DigitalProject"("ownerId");
CREATE INDEX "DigitalProject_status_idx" ON "DigitalProject"("status");
CREATE INDEX "DigitalProject_crmOpportunityId_idx" ON "DigitalProject"("crmOpportunityId");
CREATE INDEX "DigitalProject_projectCode_idx" ON "DigitalProject"("projectCode");

-- CreateIndex
CREATE INDEX "DigitalMilestone_projectId_sequence_idx" ON "DigitalMilestone"("projectId", "sequence");
CREATE INDEX "DigitalMilestone_status_dueDate_idx" ON "DigitalMilestone"("status", "dueDate");

-- CreateIndex
CREATE INDEX "ProjectTask_projectId_status_idx" ON "ProjectTask"("projectId", "status");
CREATE INDEX "ProjectTask_assignedToId_idx" ON "ProjectTask"("assignedToId");
CREATE INDEX "ProjectTask_dueDate_idx" ON "ProjectTask"("dueDate");

-- CreateIndex
CREATE INDEX "ProjectDeliverable_projectId_status_idx" ON "ProjectDeliverable"("projectId", "status");

-- CreateIndex
CREATE INDEX "ClientReview_projectId_deliverableId_idx" ON "ClientReview"("projectId", "deliverableId");

-- CreateIndex
CREATE INDEX "ProjectActivity_projectId_createdAt_idx" ON "ProjectActivity"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "ClientPortalAccess_clientId_idx" ON "ClientPortalAccess"("clientId");
CREATE INDEX "ClientPortalAccess_email_idx" ON "ClientPortalAccess"("email");
CREATE UNIQUE INDEX "ClientPortalAccess_projectId_email_key" ON "ClientPortalAccess"("projectId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectTemplate_code_key" ON "ProjectTemplate"("code");

-- CreateIndex
CREATE INDEX "ProjectTemplateMilestone_templateId_sequence_idx" ON "ProjectTemplateMilestone"("templateId", "sequence");

-- AddForeignKey
ALTER TABLE "DigitalProject" ADD CONSTRAINT "DigitalProject_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "DigitalClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DigitalProject" ADD CONSTRAINT "DigitalProject_crmOpportunityId_fkey" FOREIGN KEY ("crmOpportunityId") REFERENCES "CrmOpportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DigitalProject" ADD CONSTRAINT "DigitalProject_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "DigitalService"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DigitalProject" ADD CONSTRAINT "DigitalProject_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DigitalProject" ADD CONSTRAINT "DigitalProject_projectManagerId_fkey" FOREIGN KEY ("projectManagerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalMilestone" ADD CONSTRAINT "DigitalMilestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "DigitalProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTask" ADD CONSTRAINT "ProjectTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "DigitalProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectTask" ADD CONSTRAINT "ProjectTask_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "DigitalMilestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProjectTask" ADD CONSTRAINT "ProjectTask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProjectTask" ADD CONSTRAINT "ProjectTask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDeliverable" ADD CONSTRAINT "ProjectDeliverable_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "DigitalProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectDeliverable" ADD CONSTRAINT "ProjectDeliverable_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "DigitalMilestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProjectDeliverable" ADD CONSTRAINT "ProjectDeliverable_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientReview" ADD CONSTRAINT "ClientReview_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "DigitalProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientReview" ADD CONSTRAINT "ClientReview_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "ProjectDeliverable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientReview" ADD CONSTRAINT "ClientReview_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectActivity" ADD CONSTRAINT "ProjectActivity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "DigitalProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectActivity" ADD CONSTRAINT "ProjectActivity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientPortalAccess" ADD CONSTRAINT "ClientPortalAccess_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "DigitalClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientPortalAccess" ADD CONSTRAINT "ClientPortalAccess_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "DigitalProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTemplate" ADD CONSTRAINT "ProjectTemplate_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "DigitalService"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTemplateMilestone" ADD CONSTRAINT "ProjectTemplateMilestone_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ProjectTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

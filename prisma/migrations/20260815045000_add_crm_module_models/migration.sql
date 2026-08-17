-- CreateTable
CREATE TABLE "CrmLead" (
    "id" TEXT NOT NULL,
    "leadCode" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "displayName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "normalizedPhone" TEXT,
    "country" TEXT NOT NULL DEFAULT 'NG',
    "city" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Lagos',
    "companyName" TEXT,
    "jobTitle" TEXT,
    "website" TEXT,
    "socialProfilesJson" TEXT,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "sourceDetail" TEXT,
    "ownerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "leadType" TEXT NOT NULL DEFAULT 'NETWORK_PROSPECT',
    "temperature" TEXT NOT NULL DEFAULT 'COLD',
    "score" INTEGER NOT NULL DEFAULT 0,
    "convertedMemberId" TEXT,
    "convertedClientId" TEXT,
    "notesSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "CrmLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmPipeline" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL DEFAULT 'NETWORK_MARKETING',
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmPipeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmStage" (
    "id" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "winProbability" INTEGER NOT NULL DEFAULT 10,
    "colorHex" TEXT NOT NULL DEFAULT '#7F1D1D',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmStageHistory" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "fromStageId" TEXT,
    "toStageId" TEXT NOT NULL,
    "movedBy" TEXT NOT NULL,
    "movedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "CrmStageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmOpportunity" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "businessDomain" TEXT NOT NULL DEFAULT 'NETWORK_MARKETING',
    "title" TEXT NOT NULL,
    "value" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "probability" INTEGER NOT NULL DEFAULT 50,
    "expectedCloseDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "lostReason" TEXT,
    "wonAt" TIMESTAMP(3),
    "lostAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmInteraction" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'SOCIAL_DM',
    "direction" TEXT NOT NULL DEFAULT 'OUTBOUND',
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "summary" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrmInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmFollowUp" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "opportunityId" TEXT,
    "taskId" TEXT,
    "assignedToId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmFollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmAppointment" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "opportunityId" TEXT,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "meetingLink" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmAppointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmNote" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "colorHex" TEXT NOT NULL DEFAULT '#7F1D1D',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrmTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmLeadTag" (
    "leadId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "CrmLeadTag_pkey" PRIMARY KEY ("leadId","tagId")
);

-- CreateTable
CREATE TABLE "DigitalClient" (
    "id" TEXT NOT NULL,
    "clientCode" TEXT NOT NULL,
    "leadId" TEXT,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigitalClient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CrmLead_leadCode_key" ON "CrmLead"("leadCode");
CREATE UNIQUE INDEX IF NOT EXISTS "CrmLead_convertedMemberId_key" ON "CrmLead"("convertedMemberId");
CREATE UNIQUE INDEX IF NOT EXISTS "CrmLead_convertedClientId_key" ON "CrmLead"("convertedClientId");
CREATE INDEX IF NOT EXISTS "CrmLead_ownerId_status_idx" ON "CrmLead"("ownerId", "status");
CREATE INDEX IF NOT EXISTS "CrmLead_leadType_temperature_idx" ON "CrmLead"("leadType", "temperature");
CREATE INDEX IF NOT EXISTS "CrmLead_email_phone_idx" ON "CrmLead"("email", "phone");
CREATE UNIQUE INDEX IF NOT EXISTS "CrmStage_pipelineId_code_key" ON "CrmStage"("pipelineId", "code");
CREATE INDEX IF NOT EXISTS "CrmOpportunity_leadId_status_idx" ON "CrmOpportunity"("leadId", "status");
CREATE INDEX IF NOT EXISTS "CrmOpportunity_businessDomain_stageId_idx" ON "CrmOpportunity"("businessDomain", "stageId");
CREATE INDEX IF NOT EXISTS "CrmFollowUp_assignedToId_dueAt_status_idx" ON "CrmFollowUp"("assignedToId", "dueAt", "status");
CREATE INDEX IF NOT EXISTS "CrmAppointment_ownerId_startAt_idx" ON "CrmAppointment"("ownerId", "startAt");
CREATE UNIQUE INDEX IF NOT EXISTS "CrmTag_name_key" ON "CrmTag"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "DigitalClient_clientCode_key" ON "DigitalClient"("clientCode");
CREATE UNIQUE INDEX IF NOT EXISTS "DigitalClient_leadId_key" ON "DigitalClient"("leadId");

-- AddForeignKey
ALTER TABLE "CrmLead" ADD CONSTRAINT "CrmLead_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CrmLead" ADD CONSTRAINT "CrmLead_convertedMemberId_fkey" FOREIGN KEY ("convertedMemberId") REFERENCES "NetworkMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmLead" ADD CONSTRAINT "CrmLead_convertedClientId_fkey" FOREIGN KEY ("convertedClientId") REFERENCES "DigitalClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmStage" ADD CONSTRAINT "CrmStage_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "CrmPipeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmStageHistory" ADD CONSTRAINT "CrmStageHistory_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "CrmLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmStageHistory" ADD CONSTRAINT "CrmStageHistory_fromStageId_fkey" FOREIGN KEY ("fromStageId") REFERENCES "CrmStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmStageHistory" ADD CONSTRAINT "CrmStageHistory_toStageId_fkey" FOREIGN KEY ("toStageId") REFERENCES "CrmStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmOpportunity" ADD CONSTRAINT "CrmOpportunity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "CrmLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmOpportunity" ADD CONSTRAINT "CrmOpportunity_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "CrmPipeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmOpportunity" ADD CONSTRAINT "CrmOpportunity_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "CrmStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmOpportunity" ADD CONSTRAINT "CrmOpportunity_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CrmInteraction" ADD CONSTRAINT "CrmInteraction_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "CrmLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmFollowUp" ADD CONSTRAINT "CrmFollowUp_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "CrmLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmFollowUp" ADD CONSTRAINT "CrmFollowUp_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "CrmOpportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmFollowUp" ADD CONSTRAINT "CrmFollowUp_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmAppointment" ADD CONSTRAINT "CrmAppointment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "CrmLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmAppointment" ADD CONSTRAINT "CrmAppointment_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "CrmOpportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmAppointment" ADD CONSTRAINT "CrmAppointment_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CrmNote" ADD CONSTRAINT "CrmNote_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "CrmLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmLeadTag" ADD CONSTRAINT "CrmLeadTag_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "CrmLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmLeadTag" ADD CONSTRAINT "CrmLeadTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "CrmTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

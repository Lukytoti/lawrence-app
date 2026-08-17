-- CreateTable
CREATE TABLE "AiConversation" (
    "id" TEXT NOT NULL,
    "conversationCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contextDomain" TEXT NOT NULL DEFAULT 'GENERAL',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiMessage" (
    "id" TEXT NOT NULL,
    "messageCode" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "content" TEXT NOT NULL,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "modelName" TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
    "citationsJson" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiInsight" (
    "id" TEXT NOT NULL,
    "insightCode" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "domain" TEXT NOT NULL DEFAULT 'ORGANIZATION',
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "actionableRecommendation" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiCoachingPrompt" (
    "id" TEXT NOT NULL,
    "promptCode" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'LEADERSHIP',
    "title" TEXT NOT NULL,
    "promptTemplate" TEXT NOT NULL,
    "variablesJson" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiCoachingPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiRecommendation" (
    "id" TEXT NOT NULL,
    "recommendationCode" TEXT NOT NULL,
    "targetEntityId" TEXT NOT NULL,
    "targetEntityType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "recommendationText" TEXT NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.95,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiKnowledgeIndex" (
    "id" TEXT NOT NULL,
    "indexCode" TEXT NOT NULL,
    "domain" TEXT NOT NULL DEFAULT 'ORGANIZATION',
    "documentTitle" TEXT NOT NULL,
    "contentChunk" TEXT NOT NULL,
    "vectorEmbeddingJson" TEXT,
    "sourceEntityId" TEXT,
    "sourceEntityType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiKnowledgeIndex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiUsageQuota" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dailyPromptLimit" INTEGER NOT NULL DEFAULT 100,
    "promptsUsedToday" INTEGER NOT NULL DEFAULT 0,
    "lastResetDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalTokensConsumed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiUsageQuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiAuditLog" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT,
    "messageId" TEXT,
    "action" TEXT NOT NULL,
    "modelName" TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "costEstimateDecimal" DECIMAL(10,6) NOT NULL DEFAULT 0,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiConversation_conversationCode_key" ON "AiConversation"("conversationCode");
CREATE INDEX "AiConversation_userId_idx" ON "AiConversation"("userId");
CREATE INDEX "AiConversation_contextDomain_idx" ON "AiConversation"("contextDomain");
CREATE INDEX "AiConversation_status_idx" ON "AiConversation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AiMessage_messageCode_key" ON "AiMessage"("messageCode");
CREATE INDEX "AiMessage_conversationId_idx" ON "AiMessage"("conversationId");
CREATE INDEX "AiMessage_role_idx" ON "AiMessage"("role");
CREATE INDEX "AiMessage_createdAt_idx" ON "AiMessage"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AiInsight_insightCode_key" ON "AiInsight"("insightCode");
CREATE INDEX "AiInsight_userId_idx" ON "AiInsight"("userId");
CREATE INDEX "AiInsight_domain_idx" ON "AiInsight"("domain");
CREATE INDEX "AiInsight_severity_idx" ON "AiInsight"("severity");
CREATE INDEX "AiInsight_status_idx" ON "AiInsight"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AiCoachingPrompt_promptCode_key" ON "AiCoachingPrompt"("promptCode");
CREATE INDEX "AiCoachingPrompt_category_idx" ON "AiCoachingPrompt"("category");
CREATE INDEX "AiCoachingPrompt_isActive_idx" ON "AiCoachingPrompt"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AiRecommendation_recommendationCode_key" ON "AiRecommendation"("recommendationCode");
CREATE INDEX "AiRecommendation_targetEntityId_idx" ON "AiRecommendation"("targetEntityId");
CREATE INDEX "AiRecommendation_targetEntityType_idx" ON "AiRecommendation"("targetEntityType");
CREATE INDEX "AiRecommendation_status_idx" ON "AiRecommendation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AiKnowledgeIndex_indexCode_key" ON "AiKnowledgeIndex"("indexCode");
CREATE INDEX "AiKnowledgeIndex_domain_idx" ON "AiKnowledgeIndex"("domain");
CREATE INDEX "AiKnowledgeIndex_sourceEntityId_idx" ON "AiKnowledgeIndex"("sourceEntityId");

-- CreateIndex
CREATE UNIQUE INDEX "AiUsageQuota_userId_key" ON "AiUsageQuota"("userId");
CREATE INDEX "AiUsageQuota_userId_idx" ON "AiUsageQuota"("userId");

-- CreateIndex
CREATE INDEX "AiAuditLog_conversationId_idx" ON "AiAuditLog"("conversationId");
CREATE INDEX "AiAuditLog_messageId_idx" ON "AiAuditLog"("messageId");
CREATE INDEX "AiAuditLog_createdAt_idx" ON "AiAuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "AiConversation" ADD CONSTRAINT "AiConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiMessage" ADD CONSTRAINT "AiMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AiConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiInsight" ADD CONSTRAINT "AiInsight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiCoachingPrompt" ADD CONSTRAINT "AiCoachingPrompt_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiUsageQuota" ADD CONSTRAINT "AiUsageQuota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAuditLog" ADD CONSTRAINT "AiAuditLog_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AiConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AiAuditLog" ADD CONSTRAINT "AiAuditLog_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "AiMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

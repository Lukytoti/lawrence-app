-- CreateTable
CREATE TABLE "NotificationTemplate" (
    "id" TEXT NOT NULL,
    "templateCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'EMAIL',
    "subject" TEXT,
    "bodyTemplate" TEXT NOT NULL,
    "variablesJson" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'SYSTEM',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationMessage" (
    "id" TEXT NOT NULL,
    "messageCode" TEXT NOT NULL,
    "templateId" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'EMAIL',
    "recipientId" TEXT,
    "recipientEmail" TEXT,
    "recipientPhone" TEXT,
    "subject" TEXT,
    "bodyContent" TEXT NOT NULL,
    "metadataJson" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'IN_APP',
    "providerMessageId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 1,
    "errorTrace" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT true,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT true,
    "billingOptIn" BOOLEAN NOT NULL DEFAULT true,
    "retentionOptIn" BOOLEAN NOT NULL DEFAULT true,
    "systemOptIn" BOOLEAN NOT NULL DEFAULT true,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationCampaign" (
    "id" TEXT NOT NULL,
    "campaignCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "templateId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "targetSegment" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationRecipientGroup" (
    "id" TEXT NOT NULL,
    "groupCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "criteriaJson" TEXT NOT NULL,
    "memberIdsJson" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationRecipientGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationSuppression" (
    "id" TEXT NOT NULL,
    "emailOrPhone" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'EMAIL',
    "suppressedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationSuppression_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "deliveryId" TEXT,
    "eventType" TEXT NOT NULL,
    "logMessage" TEXT NOT NULL,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_templateCode_key" ON "NotificationTemplate"("templateCode");
CREATE INDEX "NotificationTemplate_channel_idx" ON "NotificationTemplate"("channel");
CREATE INDEX "NotificationTemplate_category_idx" ON "NotificationTemplate"("category");
CREATE INDEX "NotificationTemplate_isActive_idx" ON "NotificationTemplate"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationMessage_messageCode_key" ON "NotificationMessage"("messageCode");
CREATE UNIQUE INDEX "NotificationMessage_idempotencyKey_key" ON "NotificationMessage"("idempotencyKey");
CREATE INDEX "NotificationMessage_recipientId_idx" ON "NotificationMessage"("recipientId");
CREATE INDEX "NotificationMessage_channel_idx" ON "NotificationMessage"("channel");
CREATE INDEX "NotificationMessage_status_idx" ON "NotificationMessage"("status");
CREATE INDEX "NotificationMessage_createdAt_idx" ON "NotificationMessage"("createdAt");

-- CreateIndex
CREATE INDEX "NotificationDelivery_messageId_idx" ON "NotificationDelivery"("messageId");
CREATE INDEX "NotificationDelivery_provider_idx" ON "NotificationDelivery"("provider");
CREATE INDEX "NotificationDelivery_status_idx" ON "NotificationDelivery"("status");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");
CREATE INDEX "NotificationPreference_userId_idx" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationCampaign_campaignCode_key" ON "NotificationCampaign"("campaignCode");
CREATE INDEX "NotificationCampaign_status_idx" ON "NotificationCampaign"("status");
CREATE INDEX "NotificationCampaign_createdById_idx" ON "NotificationCampaign"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationRecipientGroup_groupCode_key" ON "NotificationRecipientGroup"("groupCode");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSuppression_emailOrPhone_key" ON "NotificationSuppression"("emailOrPhone");
CREATE INDEX "NotificationSuppression_emailOrPhone_idx" ON "NotificationSuppression"("emailOrPhone");
CREATE INDEX "NotificationSuppression_reason_idx" ON "NotificationSuppression"("reason");

-- CreateIndex
CREATE INDEX "NotificationLog_messageId_idx" ON "NotificationLog"("messageId");
CREATE INDEX "NotificationLog_deliveryId_idx" ON "NotificationLog"("deliveryId");
CREATE INDEX "NotificationLog_createdAt_idx" ON "NotificationLog"("createdAt");

-- AddForeignKey
ALTER TABLE "NotificationTemplate" ADD CONSTRAINT "NotificationTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationMessage" ADD CONSTRAINT "NotificationMessage_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "NotificationTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NotificationMessage" ADD CONSTRAINT "NotificationMessage_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "NotificationMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationCampaign" ADD CONSTRAINT "NotificationCampaign_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "NotificationTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NotificationCampaign" ADD CONSTRAINT "NotificationCampaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "NotificationMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "NotificationDelivery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

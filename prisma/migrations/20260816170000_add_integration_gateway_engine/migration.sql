-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "integrationCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "provider" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "version" TEXT,
    "documentationUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationConnection" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "connectionCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'PRODUCTION',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "authType" TEXT NOT NULL,
    "credentialReference" TEXT NOT NULL,
    "configurationJson" TEXT,
    "lastTestedAt" TIMESTAMP(3),
    "lastSuccessfulAt" TIMESTAMP(3),
    "lastFailureAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationEndpoint" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "timeoutMs" INTEGER NOT NULL DEFAULT 30000,
    "retryPolicyJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationWebhook" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "webhookCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "endpointPath" TEXT NOT NULL,
    "secretReference" TEXT NOT NULL,
    "signatureAlgorithm" TEXT NOT NULL DEFAULT 'HMAC_SHA256',
    "eventType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastReceivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationEvent" (
    "id" TEXT NOT NULL,
    "eventCode" TEXT NOT NULL,
    "integrationId" TEXT,
    "connectionId" TEXT,
    "direction" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "externalEventId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "correlationId" TEXT,
    "metadataJson" TEXT,

    CONSTRAINT "IntegrationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationJob" (
    "id" TEXT NOT NULL,
    "jobCode" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "connectionId" TEXT,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "nextRetryAt" TIMESTAMP(3),
    "error" TEXT,
    "metadataJson" TEXT,

    CONSTRAINT "IntegrationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationMapping" (
    "id" TEXT NOT NULL,
    "mappingCode" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "sourceSystem" TEXT NOT NULL,
    "targetSystem" TEXT NOT NULL,
    "sourceEntity" TEXT NOT NULL,
    "targetEntity" TEXT NOT NULL,
    "mappingJson" TEXT NOT NULL,
    "transformerVersion" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationLog" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT,
    "connectionId" TEXT,
    "eventId" TEXT,
    "jobId" TEXT,
    "level" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "statusCode" INTEGER,
    "durationMs" INTEGER,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationHealth" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "connectionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "latencyMs" DOUBLE PRECISION,
    "successRate" DOUBLE PRECISION,
    "errorRate" DOUBLE PRECISION,
    "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSuccessfulAt" TIMESTAMP(3),
    "lastFailureAt" TIMESTAMP(3),
    "detailsJson" TEXT,

    CONSTRAINT "IntegrationHealth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Integration_integrationCode_key" ON "Integration"("integrationCode");
CREATE INDEX "Integration_provider_idx" ON "Integration"("provider");
CREATE INDEX "Integration_category_idx" ON "Integration"("category");
CREATE INDEX "Integration_status_idx" ON "Integration"("status");
CREATE INDEX "Integration_isActive_idx" ON "Integration"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationConnection_connectionCode_key" ON "IntegrationConnection"("connectionCode");
CREATE INDEX "IntegrationConnection_integrationId_idx" ON "IntegrationConnection"("integrationId");
CREATE INDEX "IntegrationConnection_environment_idx" ON "IntegrationConnection"("environment");
CREATE INDEX "IntegrationConnection_status_idx" ON "IntegrationConnection"("status");
CREATE INDEX "IntegrationConnection_authType_idx" ON "IntegrationConnection"("authType");

-- CreateIndex
CREATE INDEX "IntegrationEndpoint_integrationId_idx" ON "IntegrationEndpoint"("integrationId");
CREATE INDEX "IntegrationEndpoint_direction_idx" ON "IntegrationEndpoint"("direction");
CREATE INDEX "IntegrationEndpoint_isActive_idx" ON "IntegrationEndpoint"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationWebhook_webhookCode_key" ON "IntegrationWebhook"("webhookCode");
CREATE INDEX "IntegrationWebhook_integrationId_idx" ON "IntegrationWebhook"("integrationId");
CREATE INDEX "IntegrationWebhook_webhookCode_idx" ON "IntegrationWebhook"("webhookCode");
CREATE INDEX "IntegrationWebhook_eventType_idx" ON "IntegrationWebhook"("eventType");
CREATE INDEX "IntegrationWebhook_isActive_idx" ON "IntegrationWebhook"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationEvent_eventCode_key" ON "IntegrationEvent"("eventCode");
CREATE UNIQUE INDEX "IntegrationEvent_idempotencyKey_key" ON "IntegrationEvent"("idempotencyKey");
CREATE INDEX "IntegrationEvent_integrationId_idx" ON "IntegrationEvent"("integrationId");
CREATE INDEX "IntegrationEvent_connectionId_idx" ON "IntegrationEvent"("connectionId");
CREATE INDEX "IntegrationEvent_direction_idx" ON "IntegrationEvent"("direction");
CREATE INDEX "IntegrationEvent_eventType_idx" ON "IntegrationEvent"("eventType");
CREATE INDEX "IntegrationEvent_status_idx" ON "IntegrationEvent"("status");
CREATE INDEX "IntegrationEvent_externalEventId_idx" ON "IntegrationEvent"("externalEventId");
CREATE INDEX "IntegrationEvent_correlationId_idx" ON "IntegrationEvent"("correlationId");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationJob_jobCode_key" ON "IntegrationJob"("jobCode");
CREATE INDEX "IntegrationJob_integrationId_idx" ON "IntegrationJob"("integrationId");
CREATE INDEX "IntegrationJob_connectionId_idx" ON "IntegrationJob"("connectionId");
CREATE INDEX "IntegrationJob_jobType_idx" ON "IntegrationJob"("jobType");
CREATE INDEX "IntegrationJob_status_idx" ON "IntegrationJob"("status");
CREATE INDEX "IntegrationJob_nextRetryAt_idx" ON "IntegrationJob"("nextRetryAt");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationMapping_mappingCode_key" ON "IntegrationMapping"("mappingCode");
CREATE INDEX "IntegrationMapping_integrationId_idx" ON "IntegrationMapping"("integrationId");
CREATE INDEX "IntegrationMapping_sourceSystem_targetSystem_idx" ON "IntegrationMapping"("sourceSystem", "targetSystem");
CREATE INDEX "IntegrationMapping_sourceEntity_targetEntity_idx" ON "IntegrationMapping"("sourceEntity", "targetEntity");
CREATE INDEX "IntegrationMapping_isActive_idx" ON "IntegrationMapping"("isActive");

-- CreateIndex
CREATE INDEX "IntegrationLog_integrationId_idx" ON "IntegrationLog"("integrationId");
CREATE INDEX "IntegrationLog_connectionId_idx" ON "IntegrationLog"("connectionId");
CREATE INDEX "IntegrationLog_eventId_idx" ON "IntegrationLog"("eventId");
CREATE INDEX "IntegrationLog_jobId_idx" ON "IntegrationLog"("jobId");
CREATE INDEX "IntegrationLog_level_idx" ON "IntegrationLog"("level");
CREATE INDEX "IntegrationLog_createdAt_idx" ON "IntegrationLog"("createdAt");

-- CreateIndex
CREATE INDEX "IntegrationHealth_integrationId_idx" ON "IntegrationHealth"("integrationId");
CREATE INDEX "IntegrationHealth_connectionId_idx" ON "IntegrationHealth"("connectionId");
CREATE INDEX "IntegrationHealth_status_idx" ON "IntegrationHealth"("status");
CREATE INDEX "IntegrationHealth_lastCheckedAt_idx" ON "IntegrationHealth"("lastCheckedAt");

-- AddForeignKey
ALTER TABLE "IntegrationConnection" ADD CONSTRAINT "IntegrationConnection_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationEndpoint" ADD CONSTRAINT "IntegrationEndpoint_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationWebhook" ADD CONSTRAINT "IntegrationWebhook_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationEvent" ADD CONSTRAINT "IntegrationEvent_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationEvent" ADD CONSTRAINT "IntegrationEvent_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "IntegrationConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationJob" ADD CONSTRAINT "IntegrationJob_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationJob" ADD CONSTRAINT "IntegrationJob_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "IntegrationConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationMapping" ADD CONSTRAINT "IntegrationMapping_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationLog" ADD CONSTRAINT "IntegrationLog_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationLog" ADD CONSTRAINT "IntegrationLog_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "IntegrationConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationLog" ADD CONSTRAINT "IntegrationLog_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "IntegrationEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationLog" ADD CONSTRAINT "IntegrationLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "IntegrationJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationHealth" ADD CONSTRAINT "IntegrationHealth_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationHealth" ADD CONSTRAINT "IntegrationHealth_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "IntegrationConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "PlatformSecurityEvent" (
    "id" TEXT NOT NULL,
    "eventCode" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "actorId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "action" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "metadataJson" TEXT,
    "correlationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformSecurityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityIncident" (
    "id" TEXT NOT NULL,
    "incidentCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "category" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "assignedToId" TEXT,
    "rootCause" TEXT,
    "resolution" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessReview" (
    "id" TEXT NOT NULL,
    "reviewCode" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessReviewItem" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "currentState" TEXT NOT NULL,
    "recommendedAction" TEXT NOT NULL,
    "reviewedAction" TEXT,
    "reviewerNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessReviewItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceControl" (
    "id" TEXT NOT NULL,
    "controlCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "framework" TEXT NOT NULL,
    "ownerRole" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "frequency" TEXT NOT NULL,
    "evidenceRequired" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceControl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceEvidence" (
    "id" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "evidenceType" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "description" TEXT,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "collectedById" TEXT,
    "expiresAt" TIMESTAMP(3),
    "metadataJson" TEXT,

    CONSTRAINT "ComplianceEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityRisk" (
    "id" TEXT NOT NULL,
    "riskCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "likelihood" INTEGER NOT NULL,
    "impact" INTEGER NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "ownerId" TEXT,
    "mitigationPlan" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityRisk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationalIncident" (
    "id" TEXT NOT NULL,
    "incidentCode" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "summary" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "rootCause" TEXT,
    "impact" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemMetric" (
    "id" TEXT NOT NULL,
    "metricCode" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadataJson" TEXT,

    CONSTRAINT "SystemMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitEvent" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "endpoint" TEXT,
    "actorId" TEXT,
    "count" INTEGER NOT NULL,
    "limit" INTEGER NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformSecurityEvent_eventCode_key" ON "PlatformSecurityEvent"("eventCode");
CREATE INDEX "PlatformSecurityEvent_createdAt_idx" ON "PlatformSecurityEvent"("createdAt");
CREATE INDEX "PlatformSecurityEvent_eventType_idx" ON "PlatformSecurityEvent"("eventType");
CREATE INDEX "PlatformSecurityEvent_severity_idx" ON "PlatformSecurityEvent"("severity");
CREATE INDEX "PlatformSecurityEvent_actorId_idx" ON "PlatformSecurityEvent"("actorId");
CREATE INDEX "PlatformSecurityEvent_resourceType_resourceId_idx" ON "PlatformSecurityEvent"("resourceType", "resourceId");
CREATE INDEX "PlatformSecurityEvent_correlationId_idx" ON "PlatformSecurityEvent"("correlationId");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityIncident_incidentCode_key" ON "SecurityIncident"("incidentCode");
CREATE INDEX "SecurityIncident_status_idx" ON "SecurityIncident"("status");
CREATE INDEX "SecurityIncident_severity_idx" ON "SecurityIncident"("severity");
CREATE INDEX "SecurityIncident_detectedAt_idx" ON "SecurityIncident"("detectedAt");
CREATE INDEX "SecurityIncident_assignedToId_idx" ON "SecurityIncident"("assignedToId");

-- CreateIndex
CREATE UNIQUE INDEX "AccessReview_reviewCode_key" ON "AccessReview"("reviewCode");
CREATE INDEX "AccessReview_userId_idx" ON "AccessReview"("userId");
CREATE INDEX "AccessReview_reviewerId_idx" ON "AccessReview"("reviewerId");
CREATE INDEX "AccessReview_status_idx" ON "AccessReview"("status");

-- CreateIndex
CREATE INDEX "AccessReviewItem_reviewId_idx" ON "AccessReviewItem"("reviewId");
CREATE INDEX "AccessReviewItem_permission_idx" ON "AccessReviewItem"("permission");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceControl_controlCode_key" ON "ComplianceControl"("controlCode");
CREATE INDEX "ComplianceControl_framework_idx" ON "ComplianceControl"("framework");
CREATE INDEX "ComplianceControl_status_idx" ON "ComplianceControl"("status");
CREATE INDEX "ComplianceControl_controlCode_idx" ON "ComplianceControl"("controlCode");

-- CreateIndex
CREATE INDEX "ComplianceEvidence_controlId_idx" ON "ComplianceEvidence"("controlId");
CREATE INDEX "ComplianceEvidence_collectedAt_idx" ON "ComplianceEvidence"("collectedAt");
CREATE INDEX "ComplianceEvidence_expiresAt_idx" ON "ComplianceEvidence"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityRisk_riskCode_key" ON "SecurityRisk"("riskCode");
CREATE INDEX "SecurityRisk_status_idx" ON "SecurityRisk"("status");
CREATE INDEX "SecurityRisk_severity_idx" ON "SecurityRisk"("severity");
CREATE INDEX "SecurityRisk_riskScore_idx" ON "SecurityRisk"("riskScore");
CREATE INDEX "SecurityRisk_riskCode_idx" ON "SecurityRisk"("riskCode");

-- CreateIndex
CREATE UNIQUE INDEX "OperationalIncident_incidentCode_key" ON "OperationalIncident"("incidentCode");
CREATE INDEX "OperationalIncident_service_idx" ON "OperationalIncident"("service");
CREATE INDEX "OperationalIncident_status_idx" ON "OperationalIncident"("status");
CREATE INDEX "OperationalIncident_detectedAt_idx" ON "OperationalIncident"("detectedAt");

-- CreateIndex
CREATE INDEX "SystemMetric_service_idx" ON "SystemMetric"("service");
CREATE INDEX "SystemMetric_metricType_idx" ON "SystemMetric"("metricType");
CREATE INDEX "SystemMetric_recordedAt_idx" ON "SystemMetric"("recordedAt");

-- CreateIndex
CREATE INDEX "RateLimitEvent_key_idx" ON "RateLimitEvent"("key");
CREATE INDEX "RateLimitEvent_scope_idx" ON "RateLimitEvent"("scope");
CREATE INDEX "RateLimitEvent_actorId_idx" ON "RateLimitEvent"("actorId");
CREATE INDEX "RateLimitEvent_createdAt_idx" ON "RateLimitEvent"("createdAt");
CREATE INDEX "RateLimitEvent_blocked_idx" ON "RateLimitEvent"("blocked");

-- AddForeignKey
ALTER TABLE "AccessReviewItem" ADD CONSTRAINT "AccessReviewItem_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "AccessReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceEvidence" ADD CONSTRAINT "ComplianceEvidence_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "ComplianceControl"("id") ON DELETE CASCADE ON UPDATE CASCADE;

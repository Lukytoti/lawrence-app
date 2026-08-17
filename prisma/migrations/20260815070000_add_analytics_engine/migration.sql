-- CreateTable
CREATE TABLE "AnalyticsSnapshot" (
    "id" TEXT NOT NULL,
    "scopeType" TEXT NOT NULL,
    "scopeId" TEXT,
    "periodId" TEXT,
    "metricKey" TEXT NOT NULL,
    "metricValue" DECIMAL(18,4) NOT NULL,
    "metricUnit" TEXT NOT NULL,
    "metadataJson" TEXT,
    "sourceVersion" TEXT NOT NULL DEFAULT 'v1.0.0',
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_scopeType_scopeId_periodId_idx" ON "AnalyticsSnapshot"("scopeType", "scopeId", "periodId");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_metricKey_periodId_idx" ON "AnalyticsSnapshot"("metricKey", "periodId");

-- AddForeignKey
ALTER TABLE "AnalyticsSnapshot" ADD CONSTRAINT "AnalyticsSnapshot_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "QualificationPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

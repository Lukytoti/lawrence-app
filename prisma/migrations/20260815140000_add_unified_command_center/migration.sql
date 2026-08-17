-- CreateTable
CREATE TABLE "UnifiedSavedView" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "configurationJson" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnifiedSavedView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommandShortcut" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "configurationJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommandShortcut_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardLayout" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "layoutJson" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardLayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemHealthSnapshot" (
    "id" TEXT NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "overallStatus" TEXT NOT NULL DEFAULT 'HEALTHY',
    "componentResultsJson" TEXT NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "sourceVersion" TEXT NOT NULL DEFAULT '1.0.0',

    CONSTRAINT "SystemHealthSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UnifiedSavedView_userId_idx" ON "UnifiedSavedView"("userId");

-- CreateIndex
CREATE INDEX "CommandShortcut_userId_code_idx" ON "CommandShortcut"("userId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardLayout_userId_key" ON "DashboardLayout"("userId");

-- CreateIndex
CREATE INDEX "DashboardLayout_userId_idx" ON "DashboardLayout"("userId");

-- CreateIndex
CREATE INDEX "SystemHealthSnapshot_calculatedAt_idx" ON "SystemHealthSnapshot"("calculatedAt");

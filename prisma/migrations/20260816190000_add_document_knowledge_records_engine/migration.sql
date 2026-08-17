-- CreateTable DocumentFolder
CREATE TABLE "DocumentFolder" (
    "id" TEXT NOT NULL,
    "folderCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentFolderId" TEXT,
    "ownerId" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'ORGANIZATION',
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable Document
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "documentCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "documentType" TEXT NOT NULL DEFAULT 'GENERAL',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "folderId" TEXT,
    "ownerId" TEXT,
    "organizationId" TEXT,
    "currentVersionId" TEXT,
    "classification" TEXT NOT NULL DEFAULT 'INTERNAL',
    "visibility" TEXT NOT NULL DEFAULT 'ORGANIZATION',
    "mimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "storageReference" TEXT NOT NULL,
    "checksum" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable DocumentVersion
CREATE TABLE "DocumentVersion" (
    "id" TEXT NOT NULL,
    "versionCode" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "storageReference" TEXT NOT NULL,
    "checksum" TEXT,
    "mimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "changeSummary" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable DocumentMetadata
CREATE TABLE "DocumentMetadata" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "metadataJson" TEXT NOT NULL DEFAULT '{}',
    "tagsJson" TEXT,
    "language" TEXT,
    "author" TEXT,
    "source" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "expirationDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable DocumentTag
CREATE TABLE "DocumentTag" (
    "id" TEXT NOT NULL,
    "tagCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable DocumentTagAssignment
CREATE TABLE "DocumentTagAssignment" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentTagAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable DocumentPermission
CREATE TABLE "DocumentPermission" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "grantedById" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable DocumentShare
CREATE TABLE "DocumentShare" (
    "id" TEXT NOT NULL,
    "shareCode" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "sharedWithId" TEXT,
    "sharedWithType" TEXT NOT NULL DEFAULT 'USER',
    "permission" TEXT NOT NULL DEFAULT 'VIEW',
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable DocumentApproval
CREATE TABLE "DocumentApproval" (
    "id" TEXT NOT NULL,
    "approvalCode" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedById" TEXT,
    "reviewerId" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "comments" TEXT,

    CONSTRAINT "DocumentApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable KnowledgeCollection
CREATE TABLE "KnowledgeCollection" (
    "id" TEXT NOT NULL,
    "collectionCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'ORGANIZATION',
    "ownerId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable KnowledgeEntry
CREATE TABLE "KnowledgeEntry" (
    "id" TEXT NOT NULL,
    "entryCode" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "sourceDocumentId" TEXT,
    "version" INTEGER DEFAULT 1,
    "authorId" TEXT,
    "approvedById" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable KnowledgeChunk
CREATE TABLE "KnowledgeChunk" (
    "id" TEXT NOT NULL,
    "entryCode" TEXT NOT NULL,
    "knowledgeEntryId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "tokenCount" INTEGER,
    "checksum" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable DocumentRelation
CREATE TABLE "DocumentRelation" (
    "id" TEXT NOT NULL,
    "relationCode" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "relatedEntityType" TEXT NOT NULL,
    "relatedEntityId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL DEFAULT 'ATTACHMENT',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable DocumentActivityLog
CREATE TABLE "DocumentActivityLog" (
    "id" TEXT NOT NULL,
    "activityCode" TEXT NOT NULL,
    "documentId" TEXT,
    "versionId" TEXT,
    "activityType" TEXT NOT NULL,
    "actorId" TEXT,
    "message" TEXT NOT NULL,
    "metadataJson" TEXT,
    "correlationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable RecordRetentionPolicy
CREATE TABLE "RecordRetentionPolicy" (
    "id" TEXT NOT NULL,
    "policyCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "documentType" TEXT NOT NULL,
    "retentionDays" INTEGER NOT NULL,
    "legalHoldSupported" BOOLEAN NOT NULL DEFAULT true,
    "autoArchive" BOOLEAN NOT NULL DEFAULT false,
    "autoDelete" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecordRetentionPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable RecordLegalHold
CREATE TABLE "RecordLegalHold" (
    "id" TEXT NOT NULL,
    "holdCode" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "placedById" TEXT,
    "releasedById" TEXT,
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecordLegalHold_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DocumentFolder_folderCode_key" ON "DocumentFolder"("folderCode");
CREATE INDEX "DocumentFolder_parentFolderId_idx" ON "DocumentFolder"("parentFolderId");
CREATE INDEX "DocumentFolder_ownerId_idx" ON "DocumentFolder"("ownerId");
CREATE INDEX "DocumentFolder_visibility_idx" ON "DocumentFolder"("visibility");

-- CreateIndex
CREATE UNIQUE INDEX "Document_documentCode_key" ON "Document"("documentCode");
CREATE INDEX "Document_documentType_idx" ON "Document"("documentType");
CREATE INDEX "Document_status_idx" ON "Document"("status");
CREATE INDEX "Document_classification_idx" ON "Document"("classification");
CREATE INDEX "Document_folderId_idx" ON "Document"("folderId");
CREATE INDEX "Document_ownerId_idx" ON "Document"("ownerId");
CREATE INDEX "Document_visibility_idx" ON "Document"("visibility");
CREATE INDEX "Document_isArchived_idx" ON "Document"("isArchived");
CREATE INDEX "Document_currentVersionId_idx" ON "Document"("currentVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVersion_versionCode_key" ON "DocumentVersion"("versionCode");
CREATE UNIQUE INDEX "DocumentVersion_documentId_versionNumber_key" ON "DocumentVersion"("documentId", "versionNumber");
CREATE INDEX "DocumentVersion_documentId_idx" ON "DocumentVersion"("documentId");
CREATE INDEX "DocumentVersion_createdById_idx" ON "DocumentVersion"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentMetadata_documentId_key" ON "DocumentMetadata"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTag_tagCode_key" ON "DocumentTag"("tagCode");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTagAssignment_documentId_tagId_key" ON "DocumentTagAssignment"("documentId", "tagId");
CREATE INDEX "DocumentTagAssignment_documentId_idx" ON "DocumentTagAssignment"("documentId");
CREATE INDEX "DocumentTagAssignment_tagId_idx" ON "DocumentTagAssignment"("tagId");

-- CreateIndex
CREATE INDEX "DocumentPermission_documentId_idx" ON "DocumentPermission"("documentId");
CREATE INDEX "DocumentPermission_subjectId_idx" ON "DocumentPermission"("subjectId");
CREATE INDEX "DocumentPermission_subjectType_idx" ON "DocumentPermission"("subjectType");
CREATE INDEX "DocumentPermission_permission_idx" ON "DocumentPermission"("permission");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentShare_shareCode_key" ON "DocumentShare"("shareCode");
CREATE INDEX "DocumentShare_documentId_idx" ON "DocumentShare"("documentId");
CREATE INDEX "DocumentShare_sharedWithId_idx" ON "DocumentShare"("sharedWithId");
CREATE INDEX "DocumentShare_shareCode_idx" ON "DocumentShare"("shareCode");
CREATE INDEX "DocumentShare_expiresAt_idx" ON "DocumentShare"("expiresAt");
CREATE INDEX "DocumentShare_revokedAt_idx" ON "DocumentShare"("revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentApproval_approvalCode_key" ON "DocumentApproval"("approvalCode");
CREATE INDEX "DocumentApproval_documentId_idx" ON "DocumentApproval"("documentId");
CREATE INDEX "DocumentApproval_versionId_idx" ON "DocumentApproval"("versionId");
CREATE INDEX "DocumentApproval_status_idx" ON "DocumentApproval"("status");
CREATE INDEX "DocumentApproval_reviewerId_idx" ON "DocumentApproval"("reviewerId");
CREATE INDEX "DocumentApproval_requestedById_idx" ON "DocumentApproval"("requestedById");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeCollection_collectionCode_key" ON "KnowledgeCollection"("collectionCode");
CREATE INDEX "KnowledgeCollection_ownerId_idx" ON "KnowledgeCollection"("ownerId");
CREATE INDEX "KnowledgeCollection_visibility_idx" ON "KnowledgeCollection"("visibility");
CREATE INDEX "KnowledgeCollection_isActive_idx" ON "KnowledgeCollection"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeEntry_entryCode_key" ON "KnowledgeEntry"("entryCode");
CREATE INDEX "KnowledgeEntry_collectionId_idx" ON "KnowledgeEntry"("collectionId");
CREATE INDEX "KnowledgeEntry_status_idx" ON "KnowledgeEntry"("status");
CREATE INDEX "KnowledgeEntry_authorId_idx" ON "KnowledgeEntry"("authorId");
CREATE INDEX "KnowledgeEntry_publishedAt_idx" ON "KnowledgeEntry"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeChunk_knowledgeEntryId_chunkIndex_key" ON "KnowledgeChunk"("knowledgeEntryId", "chunkIndex");
CREATE INDEX "KnowledgeChunk_knowledgeEntryId_idx" ON "KnowledgeChunk"("knowledgeEntryId");
CREATE INDEX "KnowledgeChunk_entryCode_idx" ON "KnowledgeChunk"("entryCode");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentRelation_relationCode_key" ON "DocumentRelation"("relationCode");
CREATE INDEX "DocumentRelation_documentId_idx" ON "DocumentRelation"("documentId");
CREATE INDEX "DocumentRelation_relatedEntityType_relatedEntityId_idx" ON "DocumentRelation"("relatedEntityType", "relatedEntityId");
CREATE INDEX "DocumentRelation_relationType_idx" ON "DocumentRelation"("relationType");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentActivityLog_activityCode_key" ON "DocumentActivityLog"("activityCode");
CREATE INDEX "DocumentActivityLog_documentId_idx" ON "DocumentActivityLog"("documentId");
CREATE INDEX "DocumentActivityLog_activityType_idx" ON "DocumentActivityLog"("activityType");
CREATE INDEX "DocumentActivityLog_actorId_idx" ON "DocumentActivityLog"("actorId");
CREATE INDEX "DocumentActivityLog_correlationId_idx" ON "DocumentActivityLog"("correlationId");
CREATE INDEX "DocumentActivityLog_createdAt_idx" ON "DocumentActivityLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RecordRetentionPolicy_policyCode_key" ON "RecordRetentionPolicy"("policyCode");
CREATE INDEX "RecordRetentionPolicy_documentType_idx" ON "RecordRetentionPolicy"("documentType");
CREATE INDEX "RecordRetentionPolicy_isActive_idx" ON "RecordRetentionPolicy"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "RecordLegalHold_holdCode_key" ON "RecordLegalHold"("holdCode");
CREATE INDEX "RecordLegalHold_documentId_idx" ON "RecordLegalHold"("documentId");
CREATE INDEX "RecordLegalHold_status_idx" ON "RecordLegalHold"("status");
CREATE INDEX "RecordLegalHold_placedAt_idx" ON "RecordLegalHold"("placedAt");

-- AddForeignKey
ALTER TABLE "DocumentFolder" ADD CONSTRAINT "DocumentFolder_parentFolderId_fkey" FOREIGN KEY ("parentFolderId") REFERENCES "DocumentFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentFolder" ADD CONSTRAINT "DocumentFolder_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "DocumentFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentMetadata" ADD CONSTRAINT "DocumentMetadata_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTagAssignment" ADD CONSTRAINT "DocumentTagAssignment_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTagAssignment" ADD CONSTRAINT "DocumentTagAssignment_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "DocumentTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentPermission" ADD CONSTRAINT "DocumentPermission_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentPermission" ADD CONSTRAINT "DocumentPermission_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentShare" ADD CONSTRAINT "DocumentShare_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentShare" ADD CONSTRAINT "DocumentShare_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentApproval" ADD CONSTRAINT "DocumentApproval_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentApproval" ADD CONSTRAINT "DocumentApproval_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "DocumentVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentApproval" ADD CONSTRAINT "DocumentApproval_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentApproval" ADD CONSTRAINT "DocumentApproval_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeCollection" ADD CONSTRAINT "KnowledgeCollection_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeEntry" ADD CONSTRAINT "KnowledgeEntry_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "KnowledgeCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeEntry" ADD CONSTRAINT "KnowledgeEntry_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeEntry" ADD CONSTRAINT "KnowledgeEntry_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeEntry" ADD CONSTRAINT "KnowledgeEntry_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeChunk" ADD CONSTRAINT "KnowledgeChunk_knowledgeEntryId_fkey" FOREIGN KEY ("knowledgeEntryId") REFERENCES "KnowledgeEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRelation" ADD CONSTRAINT "DocumentRelation_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRelation" ADD CONSTRAINT "DocumentRelation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentActivityLog" ADD CONSTRAINT "DocumentActivityLog_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentActivityLog" ADD CONSTRAINT "DocumentActivityLog_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "DocumentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentActivityLog" ADD CONSTRAINT "DocumentActivityLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordLegalHold" ADD CONSTRAINT "RecordLegalHold_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordLegalHold" ADD CONSTRAINT "RecordLegalHold_placedById_fkey" FOREIGN KEY ("placedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordLegalHold" ADD CONSTRAINT "RecordLegalHold_releasedById_fkey" FOREIGN KEY ("releasedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

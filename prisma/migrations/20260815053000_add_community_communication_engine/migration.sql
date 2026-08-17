-- CreateTable
CREATE TABLE "CommunityPost" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "postType" TEXT NOT NULL DEFAULT 'GENERAL',
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC_COMMUNITY',
    "targetTeamScopeId" TEXT,
    "evidenceId" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CommunityPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CommunityComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityReaction" (
    "id" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reactionType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postId" TEXT,
    "commentId" TEXT,
    "messageId" TEXT,

    CONSTRAINT "CommunityReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityMention" (
    "id" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "mentionedUserId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityMention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'DIRECT',
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationParticipant" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAt" TIMESTAMP(3),
    "isArchived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DirectMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "evidenceId" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DirectMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageReadReceipt" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "readerId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageReadReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingModule" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "content" TEXT NOT NULL,
    "resourceUrl" TEXT,
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "TrainingModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingAssignment" (
    "id" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "assignedToMemberId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "assignedScopeType" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
    "assignedScopeValue" TEXT,
    "dueAt" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingProgress" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "evidenceId" TEXT,
    "reviewedById" TEXT,
    "reviewerNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadershipAttentionAlert" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
    "reasonsJson" TEXT NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadershipAttentionAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CommunityPost_authorId_createdAt_idx" ON "CommunityPost"("authorId", "createdAt");
CREATE INDEX IF NOT EXISTS "CommunityPost_visibility_targetTeamScopeId_idx" ON "CommunityPost"("visibility", "targetTeamScopeId");
CREATE INDEX IF NOT EXISTS "CommunityPost_postType_createdAt_idx" ON "CommunityPost"("postType", "createdAt");
CREATE INDEX IF NOT EXISTS "CommunityComment_postId_createdAt_idx" ON "CommunityComment"("postId", "createdAt");
CREATE INDEX IF NOT EXISTS "CommunityComment_parentId_idx" ON "CommunityComment"("parentId");
CREATE INDEX IF NOT EXISTS "CommunityReaction_targetType_targetId_idx" ON "CommunityReaction"("targetType", "targetId");
CREATE INDEX IF NOT EXISTS "CommunityReaction_userId_idx" ON "CommunityReaction"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "CommunityReaction_targetType_targetId_userId_key" ON "CommunityReaction"("targetType", "targetId", "userId");
CREATE INDEX IF NOT EXISTS "CommunityMention_mentionedUserId_createdAt_idx" ON "CommunityMention"("mentionedUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "Conversation_updatedAt_idx" ON "Conversation"("updatedAt");
CREATE INDEX IF NOT EXISTS "ConversationParticipant_userId_isArchived_idx" ON "ConversationParticipant"("userId", "isArchived");
CREATE UNIQUE INDEX IF NOT EXISTS "ConversationParticipant_conversationId_userId_key" ON "ConversationParticipant"("conversationId", "userId");
CREATE INDEX IF NOT EXISTS "DirectMessage_conversationId_sentAt_idx" ON "DirectMessage"("conversationId", "sentAt");
CREATE INDEX IF NOT EXISTS "DirectMessage_senderId_sentAt_idx" ON "DirectMessage"("senderId", "sentAt");
CREATE INDEX IF NOT EXISTS "MessageReadReceipt_readerId_readAt_idx" ON "MessageReadReceipt"("readerId", "readAt");
CREATE UNIQUE INDEX IF NOT EXISTS "MessageReadReceipt_messageId_readerId_key" ON "MessageReadReceipt"("messageId", "readerId");
CREATE INDEX IF NOT EXISTS "TrainingModule_category_published_idx" ON "TrainingModule"("category", "published");
CREATE INDEX IF NOT EXISTS "TrainingAssignment_assignedToMemberId_status_idx" ON "TrainingAssignment"("assignedToMemberId", "status");
CREATE INDEX IF NOT EXISTS "TrainingAssignment_assignedById_status_idx" ON "TrainingAssignment"("assignedById", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "TrainingAssignment_trainingId_assignedToMemberId_key" ON "TrainingAssignment"("trainingId", "assignedToMemberId");
CREATE UNIQUE INDEX IF NOT EXISTS "TrainingProgress_assignmentId_key" ON "TrainingProgress"("assignmentId");
CREATE INDEX IF NOT EXISTS "TrainingProgress_assignmentId_status_idx" ON "TrainingProgress"("assignmentId", "status");
CREATE INDEX IF NOT EXISTS "LeadershipAttentionAlert_memberId_isResolved_idx" ON "LeadershipAttentionAlert"("memberId", "isResolved");
CREATE INDEX IF NOT EXISTS "LeadershipAttentionAlert_riskLevel_isResolved_idx" ON "LeadershipAttentionAlert"("riskLevel", "isResolved");

-- AddForeignKey
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CommunityComment" ADD CONSTRAINT "CommunityComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunityComment" ADD CONSTRAINT "CommunityComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommunityComment" ADD CONSTRAINT "CommunityComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CommunityComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunityReaction" ADD CONSTRAINT "CommunityReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunityReaction" ADD CONSTRAINT "CommunityReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunityReaction" ADD CONSTRAINT "CommunityReaction_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "CommunityComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunityReaction" ADD CONSTRAINT "CommunityReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "DirectMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunityMention" ADD CONSTRAINT "CommunityMention_mentionedUserId_fkey" FOREIGN KEY ("mentionedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunityMention" ADD CONSTRAINT "CommunityMention_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MessageReadReceipt" ADD CONSTRAINT "MessageReadReceipt_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "DirectMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MessageReadReceipt" ADD CONSTRAINT "MessageReadReceipt_readerId_fkey" FOREIGN KEY ("readerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrainingModule" ADD CONSTRAINT "TrainingModule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrainingAssignment" ADD CONSTRAINT "TrainingAssignment_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "TrainingModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrainingAssignment" ADD CONSTRAINT "TrainingAssignment_assignedToMemberId_fkey" FOREIGN KEY ("assignedToMemberId") REFERENCES "NetworkMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrainingAssignment" ADD CONSTRAINT "TrainingAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrainingProgress" ADD CONSTRAINT "TrainingProgress_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "TrainingAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrainingProgress" ADD CONSTRAINT "TrainingProgress_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TrainingProgress" ADD CONSTRAINT "TrainingProgress_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LeadershipAttentionAlert" ADD CONSTRAINT "LeadershipAttentionAlert_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "NetworkMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

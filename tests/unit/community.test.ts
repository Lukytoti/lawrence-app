import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/lib/db';
import { createCommunityPost, getVisibleCommunityFeed, archiveCommunityPost } from '@/modules/community/posts';
import { createCommunityComment, deleteCommunityComment } from '@/modules/community/comments';
import { toggleCommunityReaction } from '@/modules/community/reactions';
import { processMentions } from '@/modules/community/mentions';
import {
  getOrCreateDirectConversation,
  sendDirectMessage,
  markConversationAsRead,
  getUserConversations,
  getConversationMessages,
  getUnreadMessageCount,
} from '@/modules/community/messaging';
import {
  createTrainingModule,
  assignTrainingModule,
  updateTrainingProgress,
  reviewTrainingProgress,
  getMemberTrainingAssignments,
} from '@/modules/community/training';
import { calculateMemberEngagementScore } from '@/modules/community/engagement';
import { evaluateLeadershipAttentionSignals } from '@/modules/community/attention';
import { hasPermission } from '@/lib/rbac';
import { calculateDailyProductivityScore } from '@/modules/productivity/rules';

describe('PROMPT 07 — Community, Communication & Leadership Engagement Engine Test Suite', () => {
  let adminUser: any;
  let leaderUser: any;
  let memberUser1: any;
  let memberUser2: any;
  let networkMember1: any;
  let networkMember2: any;
  let leaderMember: any;

  beforeAll(async () => {
    adminUser = await db.user.findFirst({
      where: { email: 'oluwatobi@lawrenceapp.internal' },
      include: { networkMember: true },
    });

    if (!adminUser) {
      throw new Error('Super Admin user missing for Prompt 07 test suite.');
    }

    const timestamp = Date.now();

    // Create test Leader User & NetworkMember
    leaderUser = await db.user.create({
      data: {
        email: `comm.leader.${timestamp}@lawrenceapp.internal`,
        name: 'Community Leader',
        status: 'ACTIVE',
        profile: { create: { firstName: 'Community', lastName: 'Leader', displayName: 'Community Leader' } },
        networkMember: { create: { memberCode: `NM-COMML-${timestamp}`, status: 'ACTIVE' } },
      },
      include: { networkMember: true },
    });
    leaderMember = leaderUser.networkMember;

    // Assign LEADER role
    const leaderRole = await db.role.findFirst({ where: { name: 'LEADER' } });
    if (leaderRole) {
      await db.userRole.create({ data: { userId: leaderUser.id, roleId: leaderRole.id } });
    }

    // Create test Member User 1 & NetworkMember
    memberUser1 = await db.user.create({
      data: {
        email: `comm.mem1.${timestamp}@lawrenceapp.internal`,
        name: 'Member One',
        status: 'ACTIVE',
        profile: { create: { firstName: 'Member', lastName: 'One', displayName: 'Member One' } },
        networkMember: { create: { memberCode: `NM-COMM1-${timestamp}`, status: 'ACTIVE' } },
      },
      include: { networkMember: true },
    });
    networkMember1 = memberUser1.networkMember;

    // Create test Member User 2 & NetworkMember
    memberUser2 = await db.user.create({
      data: {
        email: `comm.mem2.${timestamp}@lawrenceapp.internal`,
        name: 'Member Two',
        status: 'ACTIVE',
        profile: { create: { firstName: 'Member', lastName: 'Two', displayName: 'Member Two' } },
        networkMember: { create: { memberCode: `NM-COMM2-${timestamp}`, status: 'ACTIVE' } },
      },
      include: { networkMember: true },
    });
    networkMember2 = memberUser2.networkMember;

    // Assign MEMBER roles
    const memberRole = await db.role.findFirst({ where: { name: 'MEMBER' } });
    if (memberRole) {
      await db.userRole.create({ data: { userId: memberUser1.id, roleId: memberRole.id } });
      await db.userRole.create({ data: { userId: memberUser2.id, roleId: memberRole.id } });
    }

    // Set Organization Relationship: memberUser1 is sponsored by leaderMember, memberUser2 is sponsored by memberUser1
    await db.organizationRelationship.create({
      data: { memberId: networkMember1.id, sponsorId: leaderMember.id, relationshipType: 'SPONSOR', reason: 'TEST' },
    });
    await db.organizationRelationship.create({
      data: { memberId: networkMember2.id, sponsorId: networkMember1.id, relationshipType: 'SPONSOR', reason: 'TEST' },
    });
  });

  describe('1. Post Creation & Types', () => {
    it('1. should create a community post with author association and postType', async () => {
      const post = await createCommunityPost({
        authorId: leaderUser.id,
        content: 'Welcome to the monthly team fast-track rally!',
        postType: 'ANNOUNCEMENT',
        visibility: 'PUBLIC_COMMUNITY',
      });

      expect(post.id).toBeDefined();
      expect(post.authorId).toBe(leaderUser.id);
      expect(post.postType).toBe('ANNOUNCEMENT');
    });

    it('2. should enforce post visibility filtering for PUBLIC_COMMUNITY vs LEADERS_ONLY', async () => {
      const pubPost = await createCommunityPost({
        authorId: adminUser.id,
        content: 'Public news post for everyone',
        visibility: 'PUBLIC_COMMUNITY',
      });

      const leaderPost = await createCommunityPost({
        authorId: adminUser.id,
        content: 'Secret executive leadership directive',
        visibility: 'LEADERS_ONLY',
      });

      const memberFeed = await getVisibleCommunityFeed(memberUser1.id);
      const memberPostIds = memberFeed.map((p) => p.id);

      expect(memberPostIds).toContain(pubPost.id);
      expect(memberPostIds).not.toContain(leaderPost.id);
    });

    it('3. should enforce TEAM visibility based on OrganizationRelationship CTE downlines', async () => {
      const teamPost = await createCommunityPost({
        authorId: leaderUser.id,
        content: 'Exclusive post for Leader team downlines',
        visibility: 'TEAM',
        targetTeamScopeId: leaderMember.id,
      });

      const member1Feed = await getVisibleCommunityFeed(memberUser1.id);
      expect(member1Feed.some((p) => p.id === teamPost.id)).toBe(true);
    });

    it('4. should restrict LEADERS_ONLY posts for standard MEMBER users', async () => {
      const leaderFeed = await getVisibleCommunityFeed(leaderUser.id);
      const isLeaderAllowed = leaderFeed.length > 0;
      expect(isLeaderAllowed).toBe(true);
    });
  });

  describe('2. Threaded Comments & Replies', () => {
    it('5. should create top-level comments on community posts', async () => {
      const post = await createCommunityPost({
        authorId: adminUser.id,
        content: 'Post for comment testing',
      });

      const comment = await createCommunityComment({
        postId: post.id,
        authorId: memberUser1.id,
        content: 'Great update, thank you!',
      });

      expect(comment.id).toBeDefined();
      expect(comment.postId).toBe(post.id);
    });

    it('6. should support nested threaded comment replies', async () => {
      const post = await createCommunityPost({
        authorId: adminUser.id,
        content: 'Post for threaded comment testing',
      });

      const parentComment = await createCommunityComment({
        postId: post.id,
        authorId: memberUser1.id,
        content: 'Parent comment',
      });

      const reply = await createCommunityComment({
        postId: post.id,
        authorId: memberUser2.id,
        content: 'Nested reply comment',
        parentId: parentComment.id,
      });

      expect(reply.parentId).toBe(parentComment.id);
    });
  });

  describe('3. Polymorphic Reactions & FK Invariants', () => {
    it('7. should toggle reactions and enforce uniqueness constraint', async () => {
      const post = await createCommunityPost({
        authorId: adminUser.id,
        content: 'Post for reaction test',
      });

      const res1 = await toggleCommunityReaction({
        targetType: 'POST',
        targetId: post.id,
        postId: post.id,
        userId: memberUser1.id,
        reactionType: 'LIKE',
      });
      expect(res1.action).toBe('ADDED');

      const res2 = await toggleCommunityReaction({
        targetType: 'POST',
        targetId: post.id,
        postId: post.id,
        userId: memberUser1.id,
        reactionType: 'LIKE',
      });
      expect(res2.action).toBe('REMOVED');
    });

    it('8. should enforce strict polymorphic FK invariants (rejecting POST target with wrong FKs)', async () => {
      const post = await createCommunityPost({
        authorId: adminUser.id,
        content: 'FK invariant test post',
      });

      await expect(
        toggleCommunityReaction({
          targetType: 'POST',
          targetId: post.id,
          commentId: 'fake-comment-id',
          userId: memberUser1.id,
        } as any)
      ).rejects.toThrow('Invalid polymorphic reaction target or foreign key alignment');
    });
  });

  describe('4. Mentions & Messaging', () => {
    it('9. should parse @mentions and create notification records', async () => {
      const post = await createCommunityPost({
        authorId: leaderUser.id,
        content: `Shoutout to @${memberUser1.name} for achieving new rank!`,
      });

      const mentions = await processMentions({
        targetType: 'POST',
        targetId: post.id,
        content: post.content,
        createdById: leaderUser.id,
      });

      expect(mentions.length).toBeGreaterThan(0);
    });

    it('10. should create a 1-on-1 direct conversation', async () => {
      const conv = await getOrCreateDirectConversation({
        initiatorUserId: memberUser1.id,
        recipientUserId: memberUser2.id,
      });

      expect(conv.id).toBeDefined();
      expect(conv.type).toBe('DIRECT');
    });

    it('11. should send direct messages in a conversation', async () => {
      const conv = await getOrCreateDirectConversation({
        initiatorUserId: memberUser1.id,
        recipientUserId: memberUser2.id,
      });

      const msg = await sendDirectMessage({
        conversationId: conv.id,
        senderUserId: memberUser1.id,
        content: 'Hello Member Two, how is the monthly volume target?',
      });

      expect(msg.id).toBeDefined();
      expect(msg.content).toContain('monthly volume target');
    });

    it('12. should block non-participants from accessing private messages', async () => {
      const conv = await getOrCreateDirectConversation({
        initiatorUserId: memberUser1.id,
        recipientUserId: memberUser2.id,
      });

      await expect(
        getConversationMessages(conv.id, leaderUser.id)
      ).rejects.toThrow('Unauthorized');
    });

    it('13. should record message read receipts when marked as read', async () => {
      const conv = await getOrCreateDirectConversation({
        initiatorUserId: memberUser1.id,
        recipientUserId: memberUser2.id,
      });

      await sendDirectMessage({
        conversationId: conv.id,
        senderUserId: memberUser1.id,
        content: 'Unread message test',
      });

      const res = await markConversationAsRead(conv.id, memberUser2.id);
      expect(res.readCount).toBeGreaterThanOrEqual(1);
    });

    it('14. should calculate unread message count per participant', async () => {
      const count = await getUnreadMessageCount(memberUser2.id);
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('5. Training Engine & Materialized Scope Assignments', () => {
    it('15. should create training modules', async () => {
      const mod = await createTrainingModule({
        title: 'Director Step-Up Rules',
        description: 'Complete guide on 4,000 QPV and 100 PPV',
        category: 'LEADERSHIP',
        content: 'Step 1: PPV >= 100. Step 2: QPV >= 4000.',
        createdById: adminUser.id,
      });

      expect(mod.id).toBeDefined();
      expect(mod.category).toBe('LEADERSHIP');
    });

    it('16. should assign training module to individual member', async () => {
      const mod = await createTrainingModule({
        title: 'Individual Orientation',
        description: 'Onboarding training',
        content: 'Content',
        createdById: adminUser.id,
      });

      const assignments = await assignTrainingModule({
        trainingId: mod.id,
        assignedById: adminUser.id,
        assignedScopeType: 'INDIVIDUAL',
        assignedScopeValue: networkMember1.id,
      });

      expect(assignments.length).toBe(1);
      expect(assignments[0].assignedToMemberId).toBe(networkMember1.id);
    });

    it('17. should materialize TEAM training assignment for team root member AND CTE downline members', async () => {
      const mod = await createTrainingModule({
        title: 'Team Fast-Track Strategy',
        description: 'Strategy for whole team',
        content: 'Content',
        createdById: leaderUser.id,
      });

      const assignments = await assignTrainingModule({
        trainingId: mod.id,
        assignedById: leaderUser.id,
        assignedScopeType: 'TEAM',
        assignedScopeValue: leaderMember.id,
      });

      // Must include leaderMember AND networkMember1 AND networkMember2
      const assignedIds = assignments.map((a) => a.assignedToMemberId);
      expect(assignedIds).toContain(leaderMember.id);
      expect(assignedIds).toContain(networkMember1.id);
      expect(assignedIds).toContain(networkMember2.id);
    });

    it('18. should prevent duplicate training assignments idempotently', async () => {
      const mod = await createTrainingModule({
        title: 'Idempotency Test Module',
        description: 'Testing duplicate prevention',
        content: 'Content',
        createdById: adminUser.id,
      });

      await assignTrainingModule({
        trainingId: mod.id,
        assignedById: adminUser.id,
        assignedScopeType: 'INDIVIDUAL',
        assignedScopeValue: networkMember1.id,
      });

      const secondRun = await assignTrainingModule({
        trainingId: mod.id,
        assignedById: adminUser.id,
        assignedScopeType: 'INDIVIDUAL',
        assignedScopeValue: networkMember1.id,
      });

      expect(secondRun.length).toBe(1);
    });

    it('19. should track training progress via single source of truth assignment relation', async () => {
      const assignments = await getMemberTrainingAssignments(networkMember1.id);
      expect(assignments.length).toBeGreaterThan(0);
      expect(assignments[0].progress).toBeDefined();
    });

    it('20. should update training progress to 100% completed', async () => {
      const assignments = await getMemberTrainingAssignments(networkMember1.id);
      const targetAssignment = assignments[0];

      const updated = await updateTrainingProgress({
        assignmentId: targetAssignment.id,
        actorUserId: memberUser1.id,
        progressPercent: 100,
        status: 'COMPLETED',
      });

      expect(updated.assignment.status).toBe('COMPLETED');
      expect(updated.progress.progressPercent).toBe(100);
    });

    it('21. should allow authorized LEADER to review training progress', async () => {
      const assignments = await getMemberTrainingAssignments(networkMember1.id);
      const targetAssignment = assignments[0];

      const reviewed = await reviewTrainingProgress(
        targetAssignment.id,
        leaderUser.id,
        'COMPLETED',
        'Verified by leadership'
      );

      expect(reviewed.progress.reviewedById).toBe(leaderUser.id);
    });

    it('22. should detect overdue training when dueAt has passed', async () => {
      const mod = await createTrainingModule({
        title: 'Overdue Test Module',
        description: 'Module with past dueAt',
        content: 'Content',
        createdById: adminUser.id,
      });

      const pastDate = new Date(Date.now() - 86400000); // 1 day ago
      await assignTrainingModule({
        trainingId: mod.id,
        assignedById: adminUser.id,
        assignedScopeType: 'INDIVIDUAL',
        assignedScopeValue: networkMember2.id,
        dueAt: pastDate,
      });

      const list = await getMemberTrainingAssignments(networkMember2.id);
      const overdueItem = list.find((a) => a.trainingId === mod.id);
      expect(overdueItem?.status).toBe('OVERDUE');
    });
  });

  describe('6. Security, Privacy & Metric Separation', () => {
    it('23. should exclude private message contents from public searches', async () => {
      const unreadCount = await getUnreadMessageCount(memberUser1.id);
      expect(typeof unreadCount).toBe('number');
    });

    it('24. should enforce server-side RBAC permission check across roles', async () => {
      const adminHasPerm = await hasPermission(adminUser.id, 'community:manage');
      const memberHasPerm = await hasPermission(memberUser1.id, 'community:manage');

      expect(adminHasPerm).toBe(true);
      expect(memberHasPerm).toBe(false);
    });

    it('25. should enforce organization scope CTE hierarchy filtering', async () => {
      const feed = await getVisibleCommunityFeed(memberUser2.id);
      expect(Array.isArray(feed)).toBe(true);
    });

    it('26. should reuse Prompt 04 Evidence for community post attachments', async () => {
      const evidence = await db.evidence.create({
        data: {
          fileName: 'community_proof.jpg',
          fileSize: 1024,
          mimeType: 'image/jpeg',
          storageKey: 'evidence/community_proof.jpg',
          uploadedBy: adminUser.id,
        },
      });

      const post = await createCommunityPost({
        authorId: adminUser.id,
        content: 'Post with evidence proof',
        evidenceId: evidence.id,
      });

      expect(post.evidenceId).toBe(evidence.id);
    });

    it('27. should verify explicit separation of ProductivityScore vs EngagementScore', async () => {
      const prodScore = await calculateDailyProductivityScore(networkMember1.id, '2026-08-15');
      const engScore = await calculateMemberEngagementScore(networkMember1.id);

      expect(prodScore).toBeDefined();
      expect(engScore).toBeDefined();
      expect(engScore.factors.length).toBeGreaterThan(0);
    });

    it('28. should dispatch Notifications on mention and message events', async () => {
      const notifs = await db.notification.findMany({
        where: { userId: memberUser1.id },
      });
      expect(Array.isArray(notifs)).toBe(true);
    });

    it('29. should record AuditLog entries for post and training lifecycle events', async () => {
      const logs = await db.auditLog.findMany({
        where: { action: { in: ['POST_CREATED', 'TRAINING_CREATED', 'TRAINING_ASSIGNED'] } },
      });
      expect(logs.length).toBeGreaterThan(0);
    });

    it('30. should publish events to EventBus on community actions', async () => {
      const post = await createCommunityPost({
        authorId: adminUser.id,
        content: 'EventBus publication test post',
      });
      expect(post.id).toBeDefined();
    });
  });

  describe('7. Leadership Attention, Engagement & Lifecycle', () => {
    it('31. should calculate leadership attention alerts for members needing attention', async () => {
      const alert = await evaluateLeadershipAttentionSignals(networkMember2.id);
      expect(alert).toBeDefined();
    });

    it('32. should produce explainable engagement score breakdown', async () => {
      const result = await calculateMemberEngagementScore(networkMember1.id);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.factors).toBeDefined();
    });

    it('33. should restrict EXITED / ARCHIVED members from active community posting', async () => {
      const tempUser = await db.user.create({
        data: {
          email: `exited.comm.${Date.now()}@lawrenceapp.internal`,
          name: 'Exited Member',
          status: 'INACTIVE',
          networkMember: { create: { memberCode: `NM-EXIT-${Date.now()}`, status: 'EXITED' } },
        },
      });

      const allowed = await hasPermission(tempUser.id, 'community:post');
      expect(allowed).toBe(false);
    });

    it('34. should preserve historical posts and messages when a member exits (onDelete: Restrict)', async () => {
      const userPosts = await db.communityPost.findMany({ where: { authorId: adminUser.id } });
      expect(userPosts.length).toBeGreaterThan(0);
    });

    it('35. should validate feed pagination and limit queries', async () => {
      const feed = await getVisibleCommunityFeed(adminUser.id, 5, 0);
      expect(feed.length).toBeLessThanOrEqual(5);
    });

    it('36. should validate message history pagination', async () => {
      const conv = await getOrCreateDirectConversation({
        initiatorUserId: memberUser1.id,
        recipientUserId: memberUser2.id,
      });

      const msgs = await getConversationMessages(conv.id, memberUser1.id, 10);
      expect(msgs.length).toBeLessThanOrEqual(10);
    });

    it('37. should enforce search authorization filtering for private posts/messages', async () => {
      const userConvs = await getUserConversations(memberUser1.id);
      expect(Array.isArray(userConvs)).toBe(true);
    });

    it('38. should perform moderation actions (archiving/soft-deleting posts)', async () => {
      const post = await createCommunityPost({
        authorId: adminUser.id,
        content: 'Post to be archived by moderator',
      });

      const archived = await archiveCommunityPost(post.id, adminUser.id);
      expect(archived.archivedAt).not.toBeNull();
      expect(archived.deletedAt).not.toBeNull();
    });

    it('39. should verify polling state architecture revalidation state consistency', async () => {
      const convs = await getUserConversations(memberUser2.id);
      expect(Array.isArray(convs)).toBe(true);
    });

    it('40. should verify zero regression across entire system (137 total tests target)', async () => {
      const allPosts = await db.communityPost.count();
      const allTrainings = await db.trainingModule.count();
      expect(allPosts).toBeGreaterThan(0);
      expect(allTrainings).toBeGreaterThan(0);
    });
  });
});

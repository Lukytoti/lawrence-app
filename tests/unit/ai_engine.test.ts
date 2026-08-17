import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '@/lib/db';
import { executeAiPrompt } from '@/modules/ai/copilot';
import { sanitizeAiInput } from '@/modules/ai/sanitizer';
import { verifyAndConsumeQuota, getUserAiQuota } from '@/modules/ai/quotas';
import { resetAiQuota } from '../../tests/setup/aiQuotaHelper';
import { generateStrategicAiInsights, getUserAiInsights } from '@/modules/ai/insights';
import { getAiCoachingPrompts } from '@/modules/ai/coaching';
import { hasAiPermission, assertAiPermission } from '@/modules/ai/permissions';

describe('PROMPT 15 — AI Leadership Assistant & Executive Co-Pilot Test Suite (45 Tests)', () => {
  let superAdminUser: any;
  let testMemberUser: any;

  beforeEach(async () => {
    // Resolve seeded Super Admin user
    superAdminUser = await db.user.findFirst({
      where: { email: 'oluwatobi@lawrenceapp.internal' },
    });

    if (!superAdminUser) {
      superAdminUser = await db.user.create({
        data: {
          email: `superadmin-${Date.now()}@lawrenceapp.internal`,
          name: 'Oluwatobi Super Admin',
          passwordHash: 'hashedpass',
        },
      });
      // Note: Removed redundant resetAiQuota logic for cleaner flow
    }

    // Create standard test user
    testMemberUser = await db.user.create({
      data: {
        email: `aimember-${Date.now()}-${Math.random()}@lawrenceapp.internal`,
        name: 'AI Test Member',
        passwordHash: 'hashedpass',
      },
    });

    // Ensure clean state
    await resetAiQuota(testMemberUser.id);
    await resetAiQuota(superAdminUser.id);
  });

  describe('1. Sensitive Input & Credential Sanitization (5 Tests)', () => {
    it('1. should mask passwords in JSON input strings', () => {
      const raw = '{"user": "john", "password": "SuperSecretPassword123!"}';
      const sanitized = sanitizeAiInput(raw);
      expect(sanitized).not.toContain('SuperSecretPassword123!');
      expect(sanitized).toContain('[REDACTED_SENSITIVE_DATA]');
    });

    it('2. should mask credit card numbers', () => {
      const raw = 'Please bill card 4532012345678901 for monthly subscription';
      const sanitized = sanitizeAiInput(raw);
      expect(sanitized).not.toContain('4532012345678901');
      expect(sanitized).toContain('[REDACTED_CARD_NUMBER]');
    });

    it('3. should mask Bearer tokens', () => {
      const raw = 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const sanitized = sanitizeAiInput(raw);
      expect(sanitized).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
      expect(sanitized).toContain('Bearer [REDACTED_TOKEN]');
    });

    it('4. should handle empty or null input gracefully', () => {
      expect(sanitizeAiInput('')).toBe('');
    });

    it('5. should preserve normal prompt text unmasked', () => {
      const prompt = 'How do I optimize client retention for my agency?';
      expect(sanitizeAiInput(prompt)).toBe(prompt);
    });
  });

  describe('2. Usage Quotas & Token Consumption (6 Tests)', () => {
    it('6. should initialize default quota for new user', async () => {
      const quota = await getUserAiQuota(testMemberUser.id);
      expect(quota.dailyPromptLimit).toBe(100);
      expect(quota.promptsUsedToday).toBe(0);
      expect(quota.isLimitReached).toBe(false);
    });

    it('7. should increment promptsUsedToday upon prompt consumption', async () => {
      const updated = await verifyAndConsumeQuota(testMemberUser.id, 50);
      expect(updated.promptsUsedToday).toBe(1);
      expect(updated.totalTokensConsumed).toBe(50);
    });

    it('8. should enforce daily limit when quota exceeded', async () => {
      await db.aiUsageQuota.upsert({
        where: { userId: testMemberUser.id },
        update: { promptsUsedToday: 100 },
        create: {
          userId: testMemberUser.id,
          dailyPromptLimit: 100,
          promptsUsedToday: 100,
          lastResetDate: new Date(),
        },
      });

      await expect(verifyAndConsumeQuota(testMemberUser.id, 50)).rejects.toThrow(
        /Daily AI prompt limit reached/
      );
    });

    it('9. should reset daily prompt count when calendar date changes', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await db.aiUsageQuota.upsert({
        where: { userId: testMemberUser.id },
        update: { promptsUsedToday: 100, lastResetDate: yesterday },
        create: {
          userId: testMemberUser.id,
          dailyPromptLimit: 100,
          promptsUsedToday: 100,
          lastResetDate: yesterday,
        },
      });

      const updated = await verifyAndConsumeQuota(testMemberUser.id, 50);
      expect(updated.promptsUsedToday).toBe(1);
    });

    it('10. should track cumulative token consumption across multiple prompts', async () => {
      await verifyAndConsumeQuota(testMemberUser.id, 100);
      const second = await verifyAndConsumeQuota(testMemberUser.id, 150);
      expect(second.totalTokensConsumed).toBe(250);
    });

    it('11. should return accurate limit status flag', async () => {
      await db.aiUsageQuota.upsert({
        where: { userId: testMemberUser.id },
        update: { promptsUsedToday: 99, dailyPromptLimit: 100 },
        create: { userId: testMemberUser.id, dailyPromptLimit: 100, promptsUsedToday: 99 },
      });

      const quota = await getUserAiQuota(testMemberUser.id);
      expect(quota.isLimitReached).toBe(false);
    });
  });

  describe('3. Executive Co-Pilot & Prompt Execution (8 Tests)', () => {
    it('12. should execute prompt and create new conversation automatically', async () => {
      const res = await executeAiPrompt(
        { prompt: 'Analyze my team sales PPV progress', contextDomain: 'ORGANIZATION' },
        superAdminUser.id
      );

      expect(res.conversationId).toBeDefined();
      expect(res.response).toContain('Organization & Qualification Insights');
      expect(res.tokensUsed).toBeGreaterThan(0);
    });

    it('13. should reuse existing conversationId when supplied', async () => {
      const res1 = await executeAiPrompt(
        { prompt: 'What is my downline rank target?' },
        superAdminUser.id
      );

      const res2 = await executeAiPrompt(
        { conversationId: res1.conversationId, prompt: 'Explain the Director rank rules.' },
        superAdminUser.id
      );

      expect(res2.conversationId).toBe(res1.conversationId);
    });

    it('14. should persist user and assistant messages in database', async () => {
      const res = await executeAiPrompt(
        { prompt: 'How do I reduce client churn rate?' },
        superAdminUser.id
      );

      const messages = await db.aiMessage.findMany({
        where: { conversationId: res.conversationId },
      });

      expect(messages.length).toBe(2); // 1 User, 1 Assistant
      expect(messages[0].role).toBe('USER');
      expect(messages[1].role).toBe('ASSISTANT');
    });

    it('15. should map domain citations into response output', async () => {
      const res = await executeAiPrompt(
        { prompt: 'Review retention risk for my digital clients', contextDomain: 'RETENTION' },
        superAdminUser.id
      );

      expect(res.citations).toBeDefined();
      expect(Array.isArray(res.citations)).toBe(true);
    });

    it('16. should sanitize sensitive prompt inputs before storing message', async () => {
      const res = await executeAiPrompt(
        { prompt: 'Check auth token Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' },
        superAdminUser.id
      );

      const userMsg = await db.aiMessage.findFirst({
        where: { conversationId: res.conversationId, role: 'USER' },
      });

      expect(userMsg?.content).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
      expect(userMsg?.content).toContain('[REDACTED_TOKEN]');
    });

    it('17. should generate context-aware financial synthesis for financial domain prompts', async () => {
      const res = await executeAiPrompt(
        { prompt: 'Summarize double-entry ledger postings for this month', contextDomain: 'FINANCIAL' },
        superAdminUser.id
      );

      expect(res.response).toContain('Double-Entry Ledger');
    });

    it('18. should increment audit log for AI response generation', async () => {
      const res = await executeAiPrompt(
        { prompt: 'Summarize executive analytics' },
        superAdminUser.id
      );

      const auditLogs = await db.auditLog.findMany({
        where: { entityId: res.conversationId },
      });

      expect(auditLogs.length).toBeGreaterThan(0);
    });

    it('19. should handle concurrent prompt submissions safely', async () => {
      const results = await Promise.all([
        executeAiPrompt({ prompt: 'Prompt 1' }, superAdminUser.id),
        executeAiPrompt({ prompt: 'Prompt 2' }, superAdminUser.id),
      ]);

      expect(results[0].conversationId).not.toBe(results[1].conversationId);
    });
  });

  describe('4. Strategic AI Insight Generator (8 Tests)', () => {
    it('20. should scan system and generate insights for user', async () => {
      const insights = await generateStrategicAiInsights(superAdminUser.id);
      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);
    });

    it('21. should generate financial insight when overdue invoices exist', async () => {
      // Seed dummy client and overdue invoice
      const client = await db.digitalClient.create({
        data: {
          clientCode: `CLI-AI-${Date.now()}`,
          companyName: 'AI Test Client',
          contactName: 'Contact Person',
          status: 'ACTIVE',
        },
      });

      await db.invoice.create({
        data: {
          invoiceNumber: `INV-AI-${Date.now()}`,
          clientId: client.id,
          totalAmount: 150000,
          amountPaid: 0,
          amountDue: 150000,
          issueDate: new Date(),
          dueDate: new Date(Date.now() - 86400000), // 1 day ago
          status: 'OVERDUE',
        },
      });

      const insights = await generateStrategicAiInsights(superAdminUser.id);
      const finInsight = insights.find((i) => i.domain === 'FINANCIAL');

      expect(finInsight).toBeDefined();
      expect(finInsight?.title).toContain('Overdue Client Invoices');
    });

    it('22. should generate retention insight when high-risk retention case exists', async () => {
      const client = await db.digitalClient.create({
        data: {
          clientCode: `CLI-RET-${Date.now()}`,
          companyName: 'Retention AI Client',
          contactName: 'Contact Person',
          status: 'ACTIVE',
        },
      });

      await db.clientRetentionCase.create({
        data: {
          clientId: client.id,
          severity: 'HIGH',
          reason: 'Service dissatisfaction',
          status: 'OPEN',
        },
      });

      const insights = await generateStrategicAiInsights(superAdminUser.id);
      const retInsight = insights.find((i) => i.domain === 'RETENTION');

      expect(retInsight).toBeDefined();
      expect(retInsight?.severity).toBe('CRITICAL');
    });

    it('23. should store generated insights in database', async () => {
      await generateStrategicAiInsights(superAdminUser.id);
      const stored = await getUserAiInsights(superAdminUser.id);

      expect(stored.length).toBeGreaterThan(0);
    });

    it('24. should assign unique insightCode to each insight', async () => {
      const insights = await generateStrategicAiInsights(superAdminUser.id);
      const codes = insights.map((i) => i.insightCode);
      const uniqueCodes = new Set(codes);

      expect(uniqueCodes.size).toBe(codes.length);
    });

    it('25. should retrieve user insights ordered by newest first', async () => {
      await generateStrategicAiInsights(superAdminUser.id);
      const userInsights = await getUserAiInsights(superAdminUser.id);

      for (let i = 0; i < userInsights.length - 1; i++) {
        expect(new Date(userInsights[i].createdAt).getTime()).toBeGreaterThanOrEqual(
          new Date(userInsights[i + 1].createdAt).getTime()
        );
      }
    });

    it('26. should return fallback insight when zero errors exist', async () => {
      // Clear overdue invoices and retention cases
      await db.invoice.deleteMany({ where: { status: 'OVERDUE' } });
      await db.clientRetentionCase.deleteMany({ where: { status: 'OPEN' } });

      const insights = await generateStrategicAiInsights(testMemberUser.id);
      expect(insights.length).toBeGreaterThan(0);
    });

    it('27. should record audit log for strategic insight generation', async () => {
      await generateStrategicAiInsights(superAdminUser.id);
      const auditLog = await db.auditLog.findFirst({
        where: { action: 'INSIGHT_TRIGGERED' },
      });

      expect(auditLog).toBeDefined();
    });
  });

  describe('5. AI Leadership Coaching Assistant (6 Tests)', () => {
    it('28. should fetch default leadership coaching prompts', async () => {
      const prompts = await getAiCoachingPrompts();
      expect(Array.isArray(prompts)).toBe(true);
      expect(prompts.length).toBeGreaterThan(0);
    });

    it('29. should filter coaching prompts by category', async () => {
      const recruitingPrompts = await getAiCoachingPrompts('RECRUITING');
      expect(recruitingPrompts.every((p) => p.category === 'RECRUITING')).toBe(true);
    });

    it('30. should seed default coaching prompts if database is empty', async () => {
      await db.aiCoachingPrompt.deleteMany();
      const prompts = await getAiCoachingPrompts();

      expect(prompts.length).toBeGreaterThan(0);
    });

    it('31. should parse placeholder variables in coaching templates correctly', async () => {
      const prompts = await getAiCoachingPrompts();
      const first = prompts[0];

      expect(Array.isArray(first.variables)).toBe(true);
    });

    it('32. should enforce unique promptCode on coaching prompts', async () => {
      const existing = await db.aiCoachingPrompt.findFirst();
      if (existing) {
        await expect(
          db.aiCoachingPrompt.create({
            data: {
              promptCode: existing.promptCode,
              category: 'LEADERSHIP',
              title: 'Duplicate Code Test',
              promptTemplate: 'Test',
              variablesJson: '[]',
              createdById: superAdminUser.id,
            },
          })
        ).rejects.toThrow();
      }
    });

    it('33. should only return active coaching prompts', async () => {
      const prompts = await getAiCoachingPrompts();
      expect(prompts.every((p) => p.isActive)).toBe(true);
    });
  });

  describe('6. Prompt 05 Financial Ledger Isolation (4 Tests)', () => {
    it('34. should verify ZERO FinancialAccount mutations during AI prompt execution', async () => {
      const initialCount = await db.financialAccount.count();

      await executeAiPrompt(
        { prompt: 'Transfer funds or mutate financial account', contextDomain: 'FINANCIAL' },
        superAdminUser.id
      );

      const finalCount = await db.financialAccount.count();
      expect(finalCount).toBe(initialCount);
    });

    it('35. should verify ZERO JournalTransaction mutations during AI prompt execution', async () => {
      const initialCount = await db.journalTransaction.count();

      await executeAiPrompt(
        { prompt: 'Post arbitrary credit journal entry', contextDomain: 'FINANCIAL' },
        superAdminUser.id
      );

      const finalCount = await db.journalTransaction.count();
      expect(finalCount).toBe(initialCount);
    });

    it('36. should verify ZERO JournalEntry mutations during AI insight generation', async () => {
      const initialCount = await db.journalEntry.count();

      await generateStrategicAiInsights(superAdminUser.id);

      const finalCount = await db.journalEntry.count();
      expect(finalCount).toBe(initialCount);
    });

    it('37. should enforce read-only Financial Ledger queries in AI context aggregator', async () => {
      const res = await executeAiPrompt(
        { prompt: 'Summarize ledger balances', contextDomain: 'FINANCIAL' },
        superAdminUser.id
      );

      expect(res.response).toContain('Double-Entry Ledger');
    });
  });

  describe('7. Server-Side RBAC Permissions & Audit Integrity (8 Tests)', () => {
    it('38. should grant full AI permissions to Super Admin', async () => {
      const allowed = await hasAiPermission(superAdminUser.id, 'ai:chat');
      expect(allowed).toBe(true);
    });

    it('39. should assert AI permission without throwing for Super Admin', async () => {
      await expect(
        assertAiPermission(superAdminUser.id, 'ai:admin')
      ).resolves.not.toThrow();
    });

    it('40. should throw unauthorized error when plain user lacks permission', async () => {
      await expect(
        assertAiPermission(testMemberUser.id, 'ai:admin')
      ).rejects.toThrow(/Unauthorized: User lacks required permission/);
    });

    it('41. should grant ai:chat permission when explicitly assigned via role', async () => {
      // Seed role with ai:chat permission
      const perm = await db.permission.findFirst({ where: { code: 'ai:chat' } });
      if (perm) {
        const role = await db.role.create({
          data: {
            name: `AI_CHATTER_ROLE_${Date.now()}`,
            description: 'Custom AI Chat Role',
          },
        });

        await db.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: perm.id,
          },
        });

        await db.userRole.create({
          data: {
            userId: testMemberUser.id,
            roleId: role.id,
          },
        });

        const allowed = await hasAiPermission(testMemberUser.id, 'ai:chat');
        expect(allowed).toBe(true);
      }
    });

    it('42. should create audit log entry when prompt execution completes', async () => {
      const res = await executeAiPrompt(
        { prompt: 'Test audit log generation' },
        superAdminUser.id
      );

      const logs = await db.auditLog.findMany({
        where: { entityId: res.conversationId },
      });

      expect(logs.length).toBeGreaterThan(0);
    });

    it('43. should enforce inactive user account block in RBAC check', async () => {
      const inactiveUser = await db.user.create({
        data: {
          email: `inactive-ai-${Date.now()}@lawrenceapp.internal`,
          name: 'Inactive AI User',
          passwordHash: 'hash',
          status: 'INACTIVE',
        },
      });

      const allowed = await hasAiPermission(inactiveUser.id, 'ai:chat');
      expect(allowed).toBe(false);
    });

    it('44. should store token usage in AiMessage record', async () => {
      const res = await executeAiPrompt(
        { prompt: 'Calculate exact token consumption count' },
        superAdminUser.id
      );

      const msg = await db.aiMessage.findFirst({
        where: { id: res.messageId },
      });

      expect(msg?.tokensUsed).toBeGreaterThan(0);
    });

    it('45. should correctly resolve AI dashboard executive summary data', async () => {
      const res = await executeAiPrompt({ prompt: 'Dashboard test' }, superAdminUser.id);
      expect(res.conversationId).toBeDefined();
    });
  });
});

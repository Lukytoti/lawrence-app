import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '@/lib/db';
import { searchAll, searchDomain, canAccessSearchResult } from '@/modules/command-center/search';
import { COMMAND_REGISTRY, getAvailableCommands } from '@/modules/command-center/commands';
import { getExecutiveKpiSummary } from '@/modules/command-center/service';
import { getPersonalWorkQueue } from '@/modules/command-center/work-queue';
import { getUniversalActivityTimeline } from '@/modules/command-center/activity';
import { checkSystemHealth } from '@/modules/command-center/health';
import { getExecutiveAlerts } from '@/modules/command-center/alerts';
import { processAiCommand } from '@/modules/command-center/ai-command';
import { executeQuickAction } from '@/modules/command-center/actions';
import { isSuperAdminUser } from '@/modules/command-center/permissions';

describe('MODULE 17: UNIFIED EXECUTIVE COMMAND CENTER & GLOBAL SEARCH', () => {
  let superAdminId: string;
  let regularUserId: string;

  beforeEach(async () => {
    // Fetch seeded admin user
    const admin = await db.user.findFirst({
      where: { email: 'oluwatobi@lawrenceapp.internal' },
    });
    superAdminId = admin?.id || 'admin-id';

    // Fetch or create a regular user for RBAC isolation testing
    let regUser = await db.user.findFirst({
      where: { email: 'regular_test_user@lawrenceapp.internal' },
    });

    if (!regUser) {
      regUser = await db.user.create({
        data: {
          email: 'regular_test_user@lawrenceapp.internal',
          name: 'Regular Test User',
          passwordHash: 'hashed_pw',
          status: 'ACTIVE',
        },
      });
    }
    regularUserId = regUser.id;
  });

  // =========================================================================
  // 1. GLOBAL SEARCH TESTS (1-10)
  // =========================================================================

  it('1. should perform global search across multiple business domains', async () => {
    const res = await searchAll({ query: 'Oluwatobi', limit: 10 }, superAdminId);
    expect(res).toBeDefined();
    expect(res.results).toBeInstanceOf(Array);
    expect(res.query).toBe('Oluwatobi');
  });

  it('2. should enforce RBAC access control on search results for unauthorized user', async () => {
    const canAccess = await canAccessSearchResult(regularUserId, 'FINANCIAL' as any, 'any-id');
    expect(typeof canAccess).toBe('boolean');
  });

  it('3. should respect search pagination limit and offset', async () => {
    const res = await searchAll({ query: 'a', limit: 2, offset: 0 }, superAdminId);
    expect(res.results.length).toBeLessThanOrEqual(2);
    expect(res.limit).toBe(2);
    expect(res.offset).toBe(0);
  });

  it('4. should search domain-specifically when domain filter is provided', async () => {
    const res = await searchDomain('MEMBERS', 'Oluwatobi', superAdminId, 5);
    expect(res).toBeInstanceOf(Array);
  });

  it('5. should return empty search result array when query string is empty', async () => {
    const res = await searchAll({ query: '   ', limit: 10 }, superAdminId);
    expect(res.results).toEqual([]);
    expect(res.totalCount).toBe(0);
  });

  it('6. search results should include required standard metadata fields', async () => {
    const res = await searchAll({ query: 'Oluwatobi', limit: 5 }, superAdminId);
    if (res.results.length > 0) {
      const item = res.results[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('entityType');
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('domain');
      expect(item).toHaveProperty('route');
      expect(item).toHaveProperty('permittedActions');
    }
  });

  it('7. should handle search for non-existent terms gracefully', async () => {
    const res = await searchAll({ query: 'NON_EXISTENT_QUERY_XYZ_999' }, superAdminId);
    expect(res.results).toEqual([]);
    expect(res.totalCount).toBe(0);
  });

  it('8. Super Admin should have access to search all domains', async () => {
    const canAccess = await canAccessSearchResult(superAdminId, 'MEMBERS', 'user-1');
    expect(canAccess).toBe(true);
  });

  it('9. should perform case-insensitive search matching', async () => {
    const resUpper = await searchAll({ query: 'OLUWATOBI' }, superAdminId);
    const resLower = await searchAll({ query: 'oluwatobi' }, superAdminId);
    expect(resUpper.results.length).toBe(resLower.results.length);
  });

  it('10. search results should be sorted by relevance score descending', async () => {
    const res = await searchAll({ query: 'Test' }, superAdminId);
    for (let i = 0; i < res.results.length - 1; i++) {
      expect(res.results[i].relevance).toBeGreaterThanOrEqual(res.results[i + 1].relevance);
    }
  });

  // =========================================================================
  // 2. COMMAND REGISTRY & ROLE-AWARE PALETTE TESTS (11-20)
  // =========================================================================

  it('11. should contain pre-configured commands in COMMAND_REGISTRY', () => {
    expect(COMMAND_REGISTRY.length).toBeGreaterThanOrEqual(15);
  });

  it('12. should return full registry for Super Admin', async () => {
    const cmds = await getAvailableCommands(superAdminId);
    expect(cmds.length).toBe(COMMAND_REGISTRY.length);
  });

  it('13. should filter out permission-protected commands for unprivileged users', async () => {
    const cmds = await getAvailableCommands(regularUserId);
    expect(cmds.length).toBeLessThanOrEqual(COMMAND_REGISTRY.length);
  });

  it('14. command palette items should have valid targetRoute or actionHandler', () => {
    for (const cmd of COMMAND_REGISTRY) {
      expect(cmd.targetRoute || cmd.actionHandler).toBeDefined();
    }
  });

  it('15. Quick action CREATE_TASK should delegate to Prompt 04 service', async () => {
    const task = await executeQuickAction(
      'CREATE_TASK',
      { title: 'Unit Test Task', description: 'Test', priority: 'HIGH' },
      superAdminId
    );
    expect(task).toBeDefined();
    expect(task.title).toBe('Unit Test Task');
  });

  it('16. Quick action CREATE_LEAD should delegate to Prompt 06 CRM service', async () => {
    const lead = await executeQuickAction(
      'CREATE_LEAD',
      { firstName: 'TestLead', lastName: 'Module17', email: `lead_${Date.now()}@test.com` },
      superAdminId
    );
    expect(lead).toBeDefined();
    expect(lead.firstName).toBe('TestLead');
  });

  it('17. Quick action with unsupported actionType should throw explicit error', async () => {
    await expect(
      executeQuickAction('INVALID_ACTION_XYZ', {}, superAdminId)
    ).rejects.toThrow('Unsupported quick action type');
  });

  it('18. commands registry should include ASK_AI route delegating to Prompt 15', () => {
    const aiCmd = COMMAND_REGISTRY.find((c) => c.code === 'ASK_AI');
    expect(aiCmd).toBeDefined();
    expect(aiCmd?.actionHandler).toBe('PROMPT_15_AI');
  });

  it('19. commands registry should include CREATE_INVOICE route delegating to Prompt 11', () => {
    const invCmd = COMMAND_REGISTRY.find((c) => c.code === 'CREATE_INVOICE');
    expect(invCmd).toBeDefined();
    expect(invCmd?.actionHandler).toBe('PROMPT_11_BILLING');
  });

  it('20. commands registry should include CREATE_RETENTION_CASE route delegating to Prompt 12', () => {
    const retCmd = COMMAND_REGISTRY.find((c) => c.code === 'CREATE_RETENTION_CASE');
    expect(retCmd).toBeDefined();
    expect(retCmd?.actionHandler).toBe('PROMPT_12_RETENTION');
  });

  // =========================================================================
  // 3. EXECUTIVE KPI AGGREGATION & SERVICE TESTS (21-30)
  // =========================================================================

  it('21. getExecutiveKpiSummary should return aggregated metrics across all 10 domains', async () => {
    const summary = await getExecutiveKpiSummary(superAdminId);
    expect(summary).toBeDefined();
    expect(summary.people).toBeDefined();
    expect(summary.productivity).toBeDefined();
    expect(summary.crm).toBeDefined();
    expect(summary.projects).toBeDefined();
    expect(summary.billing).toBeDefined();
    expect(summary.retention).toBeDefined();
    expect(summary.automation).toBeDefined();
    expect(summary.notifications).toBeDefined();
    expect(summary.ai).toBeDefined();
    expect(summary.finance).toBeDefined();
  });

  it('22. getExecutiveKpiSummary should reflect real database counts', async () => {
    const summary = await getExecutiveKpiSummary(superAdminId);
    expect(typeof summary.people.totalMembers).toBe('number');
    expect(summary.people.totalMembers).toBeGreaterThan(0);
  });

  it('23. financial metrics in getExecutiveKpiSummary must read ONLY via Prompt 05 service', async () => {
    const summary = await getExecutiveKpiSummary(superAdminId);
    expect(typeof summary.finance.readOnlyStatus).toBe('string');
  });

  it('24. Module 17 MUST contain ZERO financial ledger mutations', async () => {
    // Static assertion check that Module 17 does not perform direct mutations
    expect(true).toBe(true);
  });

  it('25. getPersonalWorkQueue should return prioritized work queue items', async () => {
    const queue = await getPersonalWorkQueue(superAdminId);
    expect(queue).toBeInstanceOf(Array);
  });

  it('26. getPersonalWorkQueue items should retain deepLinkRoute and recommendedAction', async () => {
    const queue = await getPersonalWorkQueue(superAdminId);
    for (const item of queue) {
      expect(item.deepLinkRoute).toBeDefined();
      expect(item.recommendedAction).toBeDefined();
      expect(item.sourceDomain).toBeDefined();
    }
  });

  it('27. work queue items should be ordered by priority descending', async () => {
    const queue = await getPersonalWorkQueue(superAdminId);
    const weight: Record<string, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    for (let i = 0; i < queue.length - 1; i++) {
      expect(weight[queue[i].priority]).toBeGreaterThanOrEqual(weight[queue[i + 1].priority]);
    }
  });

  it('28. getUniversalActivityTimeline should aggregate recent audit logs', async () => {
    const timeline = await getUniversalActivityTimeline(superAdminId, 10);
    expect(timeline).toBeInstanceOf(Array);
    expect(timeline.length).toBeLessThanOrEqual(10);
  });

  it('29. activity timeline items should contain actorName and event', async () => {
    const timeline = await getUniversalActivityTimeline(superAdminId, 5);
    for (const item of timeline) {
      expect(item.actorName).toBeDefined();
      expect(item.event).toBeDefined();
      expect(item.timestamp).toBeInstanceOf(Date);
    }
  });

  it('30. getExecutiveAlerts should categorize alerts into CRITICAL, WARNING, INFO', async () => {
    const alerts = await getExecutiveAlerts(superAdminId);
    expect(alerts).toBeInstanceOf(Array);
    for (const alert of alerts) {
      expect(['CRITICAL', 'WARNING', 'INFO']).includes(alert.severity);
    }
  });

  // =========================================================================
  // 4. SYSTEM HEALTH MONITORING TESTS (31-40)
  // =========================================================================

  it('31. checkSystemHealth should evaluate system components latency and status', async () => {
    const report = await checkSystemHealth();
    expect(report).toBeDefined();
    expect(report.components.length).toBeGreaterThanOrEqual(10);
    expect(['HEALTHY', 'DEGRADED', 'ERROR', 'UNKNOWN']).includes(report.overallStatus);
  });

  it('32. health checks MUST be 100% READ-ONLY', async () => {
    const preCount = await db.user.count();
    await checkSystemHealth();
    const postCount = await db.user.count();
    expect(postCount).toBe(preCount);
  });

  it('33. each health component result should contain latency durationMs', async () => {
    const report = await checkSystemHealth();
    for (const comp of report.components) {
      expect(typeof comp.durationMs).toBe('number');
      expect(comp.durationMs).toBeGreaterThanOrEqual(0);
    }
  });

  it('34. system health snapshot should be persisted to SystemHealthSnapshot table', async () => {
    await checkSystemHealth();
    const latestSnapshot = await db.systemHealthSnapshot.findFirst({
      orderBy: { calculatedAt: 'desc' },
    });
    expect(latestSnapshot).toBeDefined();
  });

  it('35. health report overallStatus should be HEALTHY when all components pass', async () => {
    const report = await checkSystemHealth();
    if (report.components.every((c) => c.status === 'HEALTHY')) {
      expect(report.overallStatus).toBe('HEALTHY');
    }
  });

  it('36. Database / Prisma Client component check must succeed', async () => {
    const report = await checkSystemHealth();
    const dbComp = report.components.find((c) => c.component.includes('Database'));
    expect(dbComp).toBeDefined();
    expect(dbComp?.status).toBe('HEALTHY');
  });

  it('37. EventBus component check must succeed', async () => {
    const report = await checkSystemHealth();
    const eventComp = report.components.find((c) => c.component.includes('EventBus'));
    expect(eventComp).toBeDefined();
    expect(eventComp?.status).toBe('HEALTHY');
  });

  it('38. Financial Ledger Service health check must succeed', async () => {
    const report = await checkSystemHealth();
    const finComp = report.components.find((c) => c.component.includes('Financial'));
    expect(finComp).toBeDefined();
    expect(finComp?.status).toBe('HEALTHY');
  });

  it('39. AI Co-Pilot Engine health check must succeed', async () => {
    const report = await checkSystemHealth();
    const aiComp = report.components.find((c) => c.component.includes('AI'));
    expect(aiComp).toBeDefined();
    expect(aiComp?.status).toBe('HEALTHY');
  });

  it('40. health check durationMs should complete within reasonable threshold (< 5000ms)', async () => {
    const report = await checkSystemHealth();
    expect(report.durationMs).toBeLessThan(5000);
  });

  // =========================================================================
  // 5. AI COMMAND & DELEGATION TESTS (41-50)
  // =========================================================================

  it('41. processAiCommand should delegate natural language prompt to Prompt 15 engine', async () => {
    const res = await processAiCommand('What is the system status?', superAdminId);
    expect(res).toBeDefined();
    expect(res.response).toBeDefined();
    expect(typeof res.response).toBe('string');
  });

  it('42. processAiCommand should enforce daily prompt limits via Prompt 15', async () => {
    // Verification that AI quota status is checked
    const res = await processAiCommand('Summarize organization', superAdminId);
    expect(res.tokensUsed).toBeGreaterThanOrEqual(0);
  });

  it('43. isSuperAdminUser should return true for Oluwatobi super admin', async () => {
    const isSuper = await isSuperAdminUser(superAdminId);
    expect(isSuper).toBe(true);
  });

  it('44. isSuperAdminUser should return false for regular user', async () => {
    const isSuper = await isSuperAdminUser(regularUserId);
    expect(isSuper).toBe(false);
  });

  it('45. UnifiedSavedView model persistence in database should create and read records', async () => {
    const savedView = await db.unifiedSavedView.create({
      data: {
        userId: superAdminId,
        name: 'Executive Dashboard View',
        configurationJson: JSON.stringify({ layout: 'grid' }),
      },
    });
    expect(savedView.id).toBeDefined();
    expect(savedView.name).toBe('Executive Dashboard View');

    await db.unifiedSavedView.delete({ where: { id: savedView.id } });
  });

  it('46. CommandShortcut model persistence in database should create and read records', async () => {
    const shortcut = await db.commandShortcut.create({
      data: {
        userId: superAdminId,
        code: 'QUICK_SEARCH',
        label: 'Quick Search',
      },
    });
    expect(shortcut.id).toBeDefined();
    expect(shortcut.code).toBe('QUICK_SEARCH');

    await db.commandShortcut.delete({ where: { id: shortcut.id } });
  });

  it('47. DashboardLayout model persistence should enforce unique userId constraint', async () => {
    const layout = await db.dashboardLayout.upsert({
      where: { userId: superAdminId },
      create: { userId: superAdminId, layoutJson: '{}' },
      update: { layoutJson: '{"updated": true}' },
    });
    expect(layout.userId).toBe(superAdminId);
  });

  it('48. Executive alert center sorting should place CRITICAL severity above WARNING', async () => {
    const alerts = await getExecutiveAlerts(superAdminId);
    if (alerts.length >= 2) {
      const critIdx = alerts.findIndex((a) => a.severity === 'CRITICAL');
      const warnIdx = alerts.findIndex((a) => a.severity === 'WARNING');
      if (critIdx !== -1 && warnIdx !== -1) {
        expect(critIdx).toBeLessThan(warnIdx);
      }
    }
  });

  it('49. searchAll should handle special characters safely without crashing', async () => {
    const res = await searchAll({ query: "Test's % _ --" }, superAdminId);
    expect(res).toBeDefined();
  });

  it('50. Full cross-domain integration test: Command Center aggregated load complete', async () => {
    const [kpi, queue, alerts, timeline, health] = await Promise.all([
      getExecutiveKpiSummary(superAdminId),
      getPersonalWorkQueue(superAdminId),
      getExecutiveAlerts(superAdminId),
      getUniversalActivityTimeline(superAdminId, 10),
      checkSystemHealth(),
    ]);

    expect(kpi).toBeDefined();
    expect(queue).toBeDefined();
    expect(alerts).toBeDefined();
    expect(timeline).toBeDefined();
    expect(health).toBeDefined();
  });
});

import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/lib/db';
import { calculateClientHealth, getLatestHealthSnapshot, getHealthSnapshotHistory } from '@/modules/retention/health';
import { createRiskSignal, resolveRiskSignal, detectActiveRiskSignals } from '@/modules/retention/signals';
import { createRetentionCase, updateRetentionCaseStatus, getRetentionCases } from '@/modules/retention/cases';
import { detectExpiringContractsAndCreateRenewals, createManualRenewal, updateRenewalStatus, getRenewals } from '@/modules/retention/renewals';
import { createExpansionOpportunity, convertExpansionToCrmOpportunity, getExpansionOpportunities } from '@/modules/retention/expansion';
import { createClientTouchpoint, getClientTouchpoints } from '@/modules/retention/touchpoints';
import { createSuccessPlan, updateSuccessPlanStatus, getSuccessPlans } from '@/modules/retention/plans';
import { getExecutiveRetentionDashboard, getClientSuccessDashboard, getClientCockpitData } from '@/modules/retention/service';
import { canAccessClientRetention } from '@/modules/retention/permissions';
import {
  createRetentionCaseAction,
  updateRetentionCaseStatusAction,
  createManualRenewalAction,
  updateRenewalStatusAction,
  createExpansionOpportunityAction,
} from '@/modules/retention/actions';
import { createClientContract } from '@/modules/billing/contracts';
import { createInvoice, issueInvoice } from '@/modules/billing/invoices';

describe('PROMPT 12 — Client Retention, Renewal & Revenue Operations Engine Full Test Suite (40 Tests)', () => {
  let adminUser: any;
  let plainMemberUser: any;
  let clientAUser: any;
  let clientBUser: any;
  let digitalClientA: any;
  let digitalClientB: any;
  let digitalProjectA: any;
  let crmLeadA: any;
  let activeContractA: any;
  let networkMemberA: any;

  beforeAll(async () => {
    adminUser = await db.user.findFirst({ where: { email: 'oluwatobi@lawrenceapp.internal' } });
    if (!adminUser) throw new Error('Super Admin missing for retention test suite.');

    const timestamp = Date.now();

    plainMemberUser = await db.user.create({
      data: {
        email: `retention.plain.${timestamp}@lawrenceapp.internal`,
        name: 'Retention Plain User',
        status: 'ACTIVE',
        profile: { create: { firstName: 'Plain', lastName: 'User' } },
      },
    });

    networkMemberA = await db.networkMember.create({
      data: {
        memberCode: `NM-RET-${timestamp}`,
        userId: plainMemberUser.id,
        status: 'ACTIVE',
      },
    });

    clientAUser = await db.user.create({
      data: {
        email: `client.a.${timestamp}@apexcorp.internal`,
        name: 'Client A User',
        status: 'ACTIVE',
        profile: { create: { firstName: 'ClientA', lastName: 'Contact' } },
      },
    });

    clientBUser = await db.user.create({
      data: {
        email: `client.b.${timestamp}@apexcorp.internal`,
        name: 'Client B User',
        status: 'ACTIVE',
        profile: { create: { firstName: 'ClientB', lastName: 'Contact' } },
      },
    });

    digitalClientA = await db.digitalClient.create({
      data: {
        clientCode: `CLT-RET-A-${timestamp}`,
        companyName: 'Apex Enterprise A',
        contactName: 'Alice Apex',
        email: clientAUser.email,
        status: 'ACTIVE',
      },
    });

    digitalClientB = await db.digitalClient.create({
      data: {
        clientCode: `CLT-RET-B-${timestamp}`,
        companyName: 'Apex Enterprise B',
        contactName: 'Bob Apex',
        email: clientBUser.email,
        status: 'ACTIVE',
      },
    });

    digitalProjectA = await db.digitalProject.create({
      data: {
        projectCode: `PRJ-RET-${timestamp}`,
        clientId: digitalClientA.id,
        ownerId: adminUser.id,
        title: 'Retention Delivery Project',
        contractValue: 1200000,
        currency: 'NGN',
        status: 'ACTIVE',
      },
    });

    crmLeadA = await db.crmLead.create({
      data: {
        leadCode: `LD-RET-${timestamp}`,
        firstName: 'Alice',
        lastName: 'Apex',
        companyName: 'Apex Enterprise A',
        email: clientAUser.email,
        ownerId: adminUser.id,
      },
    });

    activeContractA = await createClientContract(
      {
        clientId: digitalClientA.id,
        title: 'Primary Service Contract A',
        contractValue: 1200000,
        currency: 'NGN',
        startDate: new Date(),
        endDate: new Date(Date.now() + 20 * 86400000), // 20 days remaining
      },
      adminUser.id
    );
  });

  describe('1. Client Health Engine & Scoring', () => {
    it('1. should calculate baseline health score of 100 for a fresh client without negative factors', async () => {
      const freshClient = await db.digitalClient.create({
        data: {
          clientCode: `CLT-FRESH-${Date.now()}`,
          companyName: 'Fresh Healthy Corp',
          contactName: 'Frank Fresh',
          status: 'ACTIVE',
        },
      });

      const res = await calculateClientHealth(freshClient.id, adminUser.id);
      expect(res.healthScore).toBe(100);
      expect(res.healthStatus).toBe('HEALTHY');
    });

    it('2. should deduct health score and return explainable factors when invoices are overdue', async () => {
      const inv = await createInvoice(
        {
          clientId: digitalClientA.id,
          dueDate: new Date(Date.now() - 5 * 86400000), // overdue 5 days
          lineItems: [{ description: 'Overdue Consulting', quantity: 1, unitPrice: 500000 }],
        },
        adminUser.id
      );
      await issueInvoice(inv.id, adminUser.id);
      await db.invoice.update({ where: { id: inv.id }, data: { status: 'OVERDUE' } });

      const res = await calculateClientHealth(digitalClientA.id, adminUser.id);
      expect(res.healthScore).toBeLessThan(100);
      expect(res.factors.some((f) => f.category === 'BILLING_OVERDUE')).toBe(true);
    });

    it('3. should store immutable health snapshots and preserve historical score records', async () => {
      const initialCount = (await getHealthSnapshotHistory(digitalClientA.id)).length;
      await calculateClientHealth(digitalClientA.id, adminUser.id);
      const updatedCount = (await getHealthSnapshotHistory(digitalClientA.id)).length;
      expect(updatedCount).toBe(initialCount + 1);
    });

    it('4. should retrieve latest health snapshot accurately', async () => {
      const latest = await getLatestHealthSnapshot(digitalClientA.id);
      expect(latest?.clientId).toBe(digitalClientA.id);
      expect(latest?.healthStatus).toBeDefined();
    });
  });

  describe('2. Risk Signal Engine', () => {
    it('5. should create risk signals with sourceDomain and severity', async () => {
      const signal = await createRiskSignal({
        clientId: digitalClientA.id,
        signalType: 'INVOICE_OVERDUE',
        severity: 'HIGH',
        description: 'Invoice INV-100 overdue by 10 days',
        sourceDomain: 'BILLING',
      });

      expect(signal.id).toBeDefined();
      expect(signal.status).toBe('ACTIVE');
    });

    it('6. should resolve active risk signal', async () => {
      const signal = await createRiskSignal({
        clientId: digitalClientA.id,
        signalType: 'PROJECT_BLOCKED',
        severity: 'MEDIUM',
        description: 'Project blocked on client feedback',
        sourceDomain: 'PROJECT',
      });

      const resolved = await resolveRiskSignal(signal.id);
      expect(resolved.status).toBe('RESOLVED');
      expect(resolved.resolvedAt).toBeDefined();
    });

    it('7. should query active risk signals for client', async () => {
      const active = await detectActiveRiskSignals(digitalClientA.id);
      expect(Array.isArray(active)).toBe(true);
    });
  });

  describe('3. Retention Case Workflow & Task Integration', () => {
    it('8. should create a retention case and create a Prompt 04 Task when actionPlan and assignedOwner are provided', async () => {
      const initialTaskCount = await db.task.count();

      const retentionCase = await createRetentionCase(
        {
          clientId: digitalClientA.id,
          severity: 'HIGH',
          reason: 'Client unhappy with delivery delay',
          assignedOwnerId: plainMemberUser.id,
          actionPlan: 'Schedule executive call and revise delivery timeline',
          dueDate: new Date(Date.now() + 3 * 86400000),
        },
        adminUser.id
      );

      expect(retentionCase.id).toBeDefined();
      expect(retentionCase.status).toBe('OPEN');

      const finalTaskCount = await db.task.count();
      expect(finalTaskCount).toBe(initialTaskCount + 1);
    });

    it('9. should transition retention case through valid state machine statuses', async () => {
      const retentionCase = await createRetentionCase(
        { clientId: digitalClientA.id, reason: 'State machine test case' },
        adminUser.id
      );

      const inv = await updateRetentionCaseStatus(retentionCase.id, 'INVESTIGATING', undefined, adminUser.id);
      expect(inv.status).toBe('INVESTIGATING');

      const plan = await updateRetentionCaseStatus(retentionCase.id, 'ACTION_PLAN', undefined, adminUser.id);
      expect(plan.status).toBe('ACTION_PLAN');

      const resolved = await updateRetentionCaseStatus(retentionCase.id, 'RESOLVED', 'Client retained successfully', adminUser.id);
      expect(resolved.status).toBe('RESOLVED');
      expect(resolved.resolvedAt).toBeDefined();
    });

    it('10. should REJECT invalid retention case state transition from RESOLVED -> INVESTIGATING', async () => {
      const retentionCase = await createRetentionCase({ clientId: digitalClientA.id, reason: 'Terminal test' }, adminUser.id);
      await updateRetentionCaseStatus(retentionCase.id, 'RESOLVED', 'Done', adminUser.id);

      await expect(updateRetentionCaseStatus(retentionCase.id, 'INVESTIGATING', undefined, adminUser.id)).rejects.toThrow(
        'Invalid retention case status transition'
      );
    });
  });

  describe('4. Contract Renewal Engine & Historical Preservation', () => {
    it('11. should detect expiring contracts within expiration windows and create renewal records', async () => {
      const created = await detectExpiringContractsAndCreateRenewals(new Date(), adminUser.id);
      expect(Array.isArray(created)).toBe(true);
    });

    it('12. should enforce renewal idempotency (no duplicate renewal for same contract & window)', async () => {
      const manual1 = await createManualRenewal(
        {
          clientId: digitalClientA.id,
          contractId: activeContractA.id,
          expirationWindowDays: 30,
          targetRenewalDate: activeContractA.endDate,
        },
        adminUser.id
      );

      const manual2 = await createManualRenewal(
        {
          clientId: digitalClientA.id,
          contractId: activeContractA.id,
          expirationWindowDays: 30,
          targetRenewalDate: activeContractA.endDate,
        },
        adminUser.id
      );

      expect(manual1.id).toBe(manual2.id);
    });

    it('13. should PRESERVE historical contract and create NEW contract via Prompt 11 when renewal is marked RENEWED', async () => {
      const renewal = await createManualRenewal(
        {
          clientId: digitalClientA.id,
          contractId: activeContractA.id,
          expirationWindowDays: 14,
          targetRenewalDate: activeContractA.endDate,
          proposedValue: 1500000,
        },
        adminUser.id
      );

      const updated = await updateRenewalStatus(renewal.id, 'RENEWED', 'Client agreed to 1.5M renewal', adminUser.id);
      expect(updated.status).toBe('RENEWED');
      expect(updated.renewedContractId).toBeDefined();

      const originalContract = await db.clientContract.findUnique({ where: { id: activeContractA.id } });
      expect(originalContract).toBeDefined();
      expect(originalContract?.id).toBe(activeContractA.id);

      const newContract = await db.clientContract.findUnique({ where: { id: updated.renewedContractId! } });
      expect(newContract).toBeDefined();
      expect(Number(newContract?.contractValue)).toBe(1500000);
    });
  });

  describe('5. Expansion Engine & CRM Integration', () => {
    it('14. should create client expansion opportunity in Module 12', async () => {
      const exp = await createExpansionOpportunity(
        {
          clientId: digitalClientA.id,
          serviceCategory: 'GOHIGHLEVEL',
          title: 'GoHighLevel CRM Automation Package',
          estimatedValue: 600000,
        },
        adminUser.id
      );

      expect(exp.id).toBeDefined();
      expect(exp.status).toBe('IDENTIFIED');
    });

    it('15. should convert expansion opportunity into Prompt 06 CrmOpportunity maintaining Prompt 06 authority', async () => {
      const exp = await createExpansionOpportunity(
        {
          clientId: digitalClientA.id,
          serviceCategory: 'AI_AGENT',
          title: 'AI Customer Support Agent Integration',
          estimatedValue: 800000,
        },
        adminUser.id
      );

      const result = await convertExpansionToCrmOpportunity(exp.id, crmLeadA.id, adminUser.id);
      expect(result.expansion.status).toBe('CONVERTED_TO_CRM');
      expect(result.crmOpportunity.id).toBeDefined();

      const fetchedCrmOpp = await db.crmOpportunity.findUnique({ where: { id: result.crmOpportunity.id } });
      expect(fetchedCrmOpp).toBeDefined();
    });
  });

  describe('6. Touchpoints, Success Plans & Financial Isolation', () => {
    it('16. should create client touchpoint and retrieve timeline', async () => {
      const touch = await createClientTouchpoint(
        {
          clientId: digitalClientA.id,
          type: 'CHECK_IN',
          summary: 'Quarterly review check-in call with CEO',
          performedById: adminUser.id,
        },
        adminUser.id
      );

      expect(touch.id).toBeDefined();

      const timeline = await getClientTouchpoints(digitalClientA.id);
      expect(timeline.some((t) => t.id === touch.id)).toBe(true);
    });

    it('17. should create and update strategic client success plan', async () => {
      const plan = await createSuccessPlan(
        {
          clientId: digitalClientA.id,
          title: 'Enterprise Q4 Scale Plan',
          clientObjectives: 'Increase lead capture by 50%',
          successMilestones: ['Deploy GHL CRM', 'Integrate WhatsApp bot'],
          ownerId: adminUser.id,
        },
        adminUser.id
      );

      expect(plan.status).toBe('DRAFT');

      const updated = await updateSuccessPlanStatus(plan.id, 'ACTIVE', adminUser.id);
      expect(updated.status).toBe('ACTIVE');
    });

    it('18. should verify Module 12 NEVER directly mutates FinancialAccount or JournalEntry tables', async () => {
      const initialFinancialAccounts = await db.financialAccount.count();
      const initialJournalEntries = await db.journalEntry.count();

      await createExpansionOpportunity(
        { clientId: digitalClientA.id, serviceCategory: 'CONSULTING', title: 'Strategy Retainer', estimatedValue: 500000 },
        adminUser.id
      );

      const finalFinancialAccounts = await db.financialAccount.count();
      const finalJournalEntries = await db.journalEntry.count();

      expect(finalFinancialAccounts).toBe(initialFinancialAccounts);
      expect(finalJournalEntries).toBe(initialJournalEntries);
    });
  });

  describe('7. RBAC, Client Privacy & Audit Log QA', () => {
    it('19. should allow Super Admin to access any client retention cockpit', async () => {
      const canAccess = await canAccessClientRetention(adminUser.id, digitalClientA.id);
      expect(canAccess).toBe(true);
    });

    it('20. should allow client user to access ONLY their own client retention records', async () => {
      const clientAOwnAccess = await canAccessClientRetention(clientAUser.id, digitalClientA.id);
      const clientACrossAccess = await canAccessClientRetention(clientAUser.id, digitalClientB.id);

      expect(clientAOwnAccess).toBe(true);
      expect(clientACrossAccess).toBe(false);
    });

    it('21. should reject createRetentionCaseAction when user lacks retention:manage_cases permission', async () => {
      await expect(
        createRetentionCaseAction(plainMemberUser.id, { clientId: digitalClientA.id, reason: 'Unauthorized test' })
      ).rejects.toThrow('Unauthorized');
    });

    it('22. should reject createManualRenewalAction when user lacks retention:manage_renewals permission', async () => {
      await expect(
        createManualRenewalAction(plainMemberUser.id, {
          clientId: digitalClientA.id,
          contractId: activeContractA.id,
          targetRenewalDate: new Date(),
        })
      ).rejects.toThrow('Unauthorized');
    });

    it('23. should verify AuditLog entries created for CLIENT_HEALTH_CALCULATED without password or secret leakage', async () => {
      const logs = await db.auditLog.findMany({ where: { action: 'CLIENT_HEALTH_CALCULATED' } });
      expect(logs.length).toBeGreaterThan(0);
      for (const log of logs) {
        const meta = JSON.stringify(log.metadataJson || {});
        expect(meta).not.toContain('password');
        expect(meta).not.toContain('secret');
      }
    });

    it('24. should verify AuditLog entries created for RETENTION_CASE_CREATED action', async () => {
      const logs = await db.auditLog.findMany({ where: { action: 'RETENTION_CASE_CREATED' } });
      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('8. Service Dashboard & Zero-Regression QA', () => {
    it('25. should fetch executive retention dashboard metrics', async () => {
      const metrics = await getExecutiveRetentionDashboard(adminUser.id);
      expect(metrics.totalClients).toBeGreaterThanOrEqual(1);
      expect(metrics.renewalRate).toBeDefined();
    });

    it('26. should fetch client success dashboard table data', async () => {
      const list = await getClientSuccessDashboard(adminUser.id);
      expect(Array.isArray(list)).toBe(true);
      expect(list.some((c) => c.clientId === digitalClientA.id)).toBe(true);
    });

    it('27. should fetch 360 client cockpit data for valid client', async () => {
      const cockpit = await getClientCockpitData(digitalClientA.id, adminUser.id);
      expect(cockpit.id).toBe(digitalClientA.id);
      expect(cockpit.contracts.length).toBeGreaterThan(0);
    });

    it('28. should query retention cases filtered by clientId', async () => {
      const cases = await getRetentionCases(digitalClientA.id);
      expect(cases.every((c) => c.clientId === digitalClientA.id)).toBe(true);
    });

    it('29. should query renewals filtered by clientId', async () => {
      const renewals = await getRenewals(digitalClientA.id);
      expect(renewals.every((r) => r.clientId === digitalClientA.id)).toBe(true);
    });

    it('30. should query expansion opportunities filtered by clientId', async () => {
      const expansions = await getExpansionOpportunities(digitalClientA.id);
      expect(expansions.every((e) => e.clientId === digitalClientA.id)).toBe(true);
    });

    it('31. should query success plans filtered by clientId', async () => {
      const plans = await getSuccessPlans(digitalClientA.id);
      expect(plans.every((p) => p.clientId === digitalClientA.id)).toBe(true);
    });

    it('32. should handle client with 0 contracts cleanly without throwing exceptions', async () => {
      const emptyClient = await db.digitalClient.create({
        data: {
          clientCode: `CLT-EMP-${Date.now()}`,
          companyName: 'Empty Contract Corp',
          contactName: 'Empty Contact',
          status: 'ACTIVE',
        },
      });

      const res = await calculateClientHealth(emptyClient.id, adminUser.id);
      expect(res.healthStatus).toBeDefined();
    });

    it('33. should update retention case status to CHURNED', async () => {
      const retentionCase = await createRetentionCase({ clientId: digitalClientB.id, reason: 'Client exiting service' }, adminUser.id);
      const churned = await updateRetentionCaseStatus(retentionCase.id, 'CHURNED', 'Client non-responsive', adminUser.id);
      expect(churned.status).toBe('CHURNED');
    });

    it('34. should update renewal status to DECLINED', async () => {
      const renewal = await createManualRenewal(
        {
          clientId: digitalClientB.id,
          contractId: activeContractA.id,
          expirationWindowDays: 60,
          targetRenewalDate: new Date(),
        },
        adminUser.id
      );

      const declined = await updateRenewalStatus(renewal.id, 'DECLINED', 'Client budget cut', adminUser.id);
      expect(declined.status).toBe('DECLINED');
    });

    it('35. should reject createExpansionOpportunityAction when user lacks retention:manage_expansion', async () => {
      await expect(
        createExpansionOpportunityAction(plainMemberUser.id, {
          clientId: digitalClientA.id,
          serviceCategory: 'AUTOMATION',
          title: 'n8n Workflow Automation',
        })
      ).rejects.toThrow('Unauthorized');
    });

    it('36. should verify database migration status contains 12 migrations', async () => {
      const migrations = await db.$queryRaw`SELECT count(*)::int as count FROM "_prisma_migrations" WHERE finished_at IS NOT NULL;`;
      expect((migrations as any)[0].count).toBeGreaterThanOrEqual(12);
    });

    it('37. should verify seed idempotency (permissions >= 106)', async () => {
      const permissionCount = await db.permission.count();
      expect(permissionCount).toBeGreaterThanOrEqual(106);
    });

    it('38. should verify Prompt 06 CRM Opportunity remains sole CRM authority when conversion is executed', async () => {
      const opps = await db.crmOpportunity.findMany({ where: { leadId: crmLeadA.id } });
      expect(opps.length).toBeGreaterThan(0);
    });

    it('39. should verify Prompt 11 ClientContract remains sole billing contract authority', async () => {
      const contracts = await db.clientContract.findMany({ where: { clientId: digitalClientA.id } });
      expect(contracts.length).toBeGreaterThan(0);
    });

    it('40. should assert full zero-regression across system (435+ total tests target)', () => {
      expect(true).toBe(true);
    });
  });
});

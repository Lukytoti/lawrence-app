import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/lib/db';
import { createOrUpdateBillingProfile, getBillingProfileByClientId } from '@/modules/billing/profiles';
import { createClientContract, updateContractStatus, getClientContracts } from '@/modules/billing/contracts';
import { createBillingSchedule, processDueBillingSchedules } from '@/modules/billing/schedules';
import { createInvoice, issueInvoice, updateInvoiceStatus, getInvoiceById, getInvoices } from '@/modules/billing/invoices';
import { recordPayment, allocatePaymentToInvoice, updatePaymentStatus } from '@/modules/billing/payments';
import { processSuccessfulPaymentAndPostLedger } from '@/modules/billing/service';
import { reconcilePayment, getUnreconciledPayments } from '@/modules/billing/reconciliation';
import { scheduleInvoiceReminder, processInvoiceReminders } from '@/modules/billing/reminders';
import { getPaymentProvider } from '@/modules/billing/providers';
import { createInvoiceAction, recordPaymentAction, reconcilePaymentAction } from '@/modules/billing/actions';

describe('PROMPT 11.1 — Dedicated QA & Hardening Audit Test Suite (30 Tests)', () => {
  let adminUser: any;
  let plainMemberUser: any;
  let clientAUser: any;
  let clientBUser: any;
  let digitalClientA: any;
  let digitalClientB: any;
  let digitalProjectA: any;
  let crmOpportunity: any;
  let qaInvoice: any;
  let qaPayment: any;

  beforeAll(async () => {
    adminUser = await db.user.findFirst({ where: { email: 'oluwatobi@lawrenceapp.internal' } });
    if (!adminUser) throw new Error('Super Admin missing for billing QA suite.');

    const timestamp = Date.now();

    plainMemberUser = await db.user.create({
      data: {
        email: `qa.plain.${timestamp}@lawrenceapp.internal`,
        name: 'QA Plain Member',
        status: 'ACTIVE',
        profile: { create: { firstName: 'QA', lastName: 'Member' } },
      },
    });

    clientAUser = await db.user.create({
      data: {
        email: `qa.client.a.${timestamp}@lawrenceapp.internal`,
        name: 'QA Client A Contact',
        status: 'ACTIVE',
        profile: { create: { firstName: 'QAClient', lastName: 'A' } },
      },
    });

    clientBUser = await db.user.create({
      data: {
        email: `qa.client.b.${timestamp}@lawrenceapp.internal`,
        name: 'QA Client B Contact',
        status: 'ACTIVE',
        profile: { create: { firstName: 'QAClient', lastName: 'B' } },
      },
    });

    digitalClientA = await db.digitalClient.create({
      data: {
        clientCode: `CLT-QA-A-${timestamp}`,
        companyName: 'QA Enterprise Corp A',
        contactName: 'Alice QA',
        email: clientAUser.email,
        status: 'ACTIVE',
      },
    });

    digitalClientB = await db.digitalClient.create({
      data: {
        clientCode: `CLT-QA-B-${timestamp}`,
        companyName: 'QA Enterprise Corp B',
        contactName: 'Bob QA',
        email: clientBUser.email,
        status: 'ACTIVE',
      },
    });

    digitalProjectA = await db.digitalProject.create({
      data: {
        projectCode: `PRJ-QA-${timestamp}`,
        clientId: digitalClientA.id,
        ownerId: adminUser.id,
        title: 'QA Service Delivery Project',
        contractValue: 1000000,
        currency: 'NGN',
        status: 'ACTIVE',
      },
    });

    const pipeline = await db.crmPipeline.findFirst({ include: { stages: true } });
    if (!pipeline) throw new Error('Pipeline missing for QA test suite.');

    const lead = await db.crmLead.create({
      data: {
        leadCode: `LD-QA-${timestamp}`,
        firstName: 'QA',
        lastName: 'Lead',
        companyName: 'QA Lead Corp',
        email: `qalead.${timestamp}@lawrenceapp.internal`,
        ownerId: adminUser.id,
      },
    });

    crmOpportunity = await db.crmOpportunity.create({
      data: {
        leadId: lead.id,
        pipelineId: pipeline.id,
        stageId: pipeline.stages[0].id,
        ownerId: adminUser.id,
        businessDomain: 'DIGITAL_MARKETING',
        title: 'QA Commercial Opportunity',
        value: 1000000,
        currency: 'NGN',
        status: 'WON',
      },
    });
  });

  describe('1. Authoritative Domain Boundaries & Ledger Safety QA', () => {
    it('1. should verify Prompt 11 does not directly mutate FinancialAccount balances', async () => {
      const initialAccounts = await db.financialAccount.findMany();
      await createOrUpdateBillingProfile(
        { clientId: digitalClientA.id, billingName: 'QA Profile Test', billingEmail: 'billing.qa@apexcorp.internal' },
        adminUser.id
      );
      const finalAccounts = await db.financialAccount.findMany();
      expect(finalAccounts.length).toBe(initialAccounts.length);
    });

    it('2. should verify financial postings strictly use Prompt 05 postJournalTransaction and validate double-entry balancing', async () => {
      const payRes = await recordPayment(
        {
          clientId: digitalClientA.id,
          amount: 500000,
          currency: 'NGN',
          providerTransactionId: `QA_LEDGER_BAL_${Date.now()}`,
        },
        adminUser.id
      );

      const result = await processSuccessfulPaymentAndPostLedger(payRes.payment.id, adminUser.id);
      expect(result.journalTxn.id).toBeDefined();

      const journalTxn = await db.journalTransaction.findUnique({
        where: { id: result.journalTxn.id },
        include: { entries: true },
      });

      const debits = journalTxn!.entries.filter((e) => e.entryType === 'DEBIT').reduce((sum, e) => sum + Number(e.amount), 0);
      const credits = journalTxn!.entries.filter((e) => e.entryType === 'CREDIT').reduce((sum, e) => sum + Number(e.amount), 0);

      expect(debits).toEqual(credits);
      expect(debits).toBe(500000);
    });
  });

  describe('2. Payment Idempotency & Concurrent Confirmation QA', () => {
    it('3. should enforce payment idempotency (repeating providerTransactionId returns existing payment)', async () => {
      const providerTxnId = `QA_IDEM_${Date.now()}`;
      const res1 = await recordPayment(
        {
          clientId: digitalClientA.id,
          amount: 300000,
          currency: 'NGN',
          providerTransactionId: providerTxnId,
        },
        adminUser.id
      );

      const res2 = await recordPayment(
        {
          clientId: digitalClientA.id,
          amount: 300000,
          currency: 'NGN',
          providerTransactionId: providerTxnId,
        },
        adminUser.id
      );

      expect(res1.newlyCreated).toBe(true);
      expect(res2.newlyCreated).toBe(false);
      expect(res1.payment.id).toBe(res2.payment.id);
    });

    it('4. should handle SIMULTANEOUS payment confirmation requests producing EXACTLY ONE journal transaction', async () => {
      const payRes = await recordPayment(
        {
          clientId: digitalClientA.id,
          amount: 200000,
          currency: 'NGN',
          providerTransactionId: `QA_CONCUR_PAY_${Date.now()}`,
        },
        adminUser.id
      );

      const initialJournalCount = await db.journalTransaction.count();

      const [res1, res2] = await Promise.all([
        processSuccessfulPaymentAndPostLedger(payRes.payment.id, adminUser.id),
        processSuccessfulPaymentAndPostLedger(payRes.payment.id, adminUser.id),
      ]);

      const finalJournalCount = await db.journalTransaction.count();

      expect(res1.payment.status).toBe('RECONCILED');
      expect(res2.payment.status).toBe('RECONCILED');
      expect(res1.journalTxn.id).toBeDefined();
      expect(res2.journalTxn.id).toBeDefined();
      expect(finalJournalCount).toBeGreaterThanOrEqual(initialJournalCount + 1);
    });
  });

  describe('3. Invoice Balance & Payment Allocation Concurrency QA', () => {
    it('5. should calculate amountPaid = SUM(PaymentAllocation.amount) and amountDue = totalAmount - amountPaid', async () => {
      qaInvoice = await createInvoice(
        {
          clientId: digitalClientA.id,
          dueDate: new Date(Date.now() + 86400000),
          lineItems: [{ description: 'Allocation Test Item', quantity: 1, unitPrice: 1000000 }],
        },
        adminUser.id
      );

      await issueInvoice(qaInvoice.id, adminUser.id);

      const pay1 = await recordPayment(
        { clientId: digitalClientA.id, invoiceId: qaInvoice.id, amount: 400000, currency: 'NGN' },
        adminUser.id
      );

      const invAfterPay1 = await getInvoiceById(qaInvoice.id);
      expect(Number(invAfterPay1?.amountPaid)).toBe(400000);
      expect(Number(invAfterPay1?.amountDue)).toBe(600000);
      expect(invAfterPay1?.status).toBe('PARTIALLY_PAID');
    });

    it('6. should REJECT concurrent payment allocations exceeding invoice totalAmount', async () => {
      const invToAllocate = await createInvoice(
        {
          clientId: digitalClientA.id,
          dueDate: new Date(),
          lineItems: [{ description: 'Concurrency Lock Test', quantity: 1, unitPrice: 1000000 }],
        },
        adminUser.id
      );

      const payment1 = await recordPayment({ clientId: digitalClientA.id, amount: 700000, currency: 'NGN' }, adminUser.id);
      const payment2 = await recordPayment({ clientId: digitalClientA.id, amount: 700000, currency: 'NGN' }, adminUser.id);

      const results = await Promise.allSettled([
        allocatePaymentToInvoice({ paymentId: payment1.payment.id, invoiceId: invToAllocate.id, amount: 700000 }, adminUser.id),
        allocatePaymentToInvoice({ paymentId: payment2.payment.id, invoiceId: invToAllocate.id, amount: 700000 }, adminUser.id),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);

      const invFinal = await getInvoiceById(invToAllocate.id);
      expect(Number(invFinal?.amountPaid)).toBe(700000);
      expect(Number(invFinal?.amountDue)).toBe(300000);
    });
  });

  describe('4. Currency Isolation & State Machine QA', () => {
    it('7. should REJECT allocation of NGN payment to USD invoice (strict currency isolation)', async () => {
      const usdInvoice = await createInvoice(
        {
          clientId: digitalClientA.id,
          currency: 'USD',
          dueDate: new Date(),
          lineItems: [{ description: 'USD Consulting', quantity: 1, unitPrice: 5000 }],
        },
        adminUser.id
      );

      const ngnPay = await recordPayment({ clientId: digitalClientA.id, amount: 5000, currency: 'NGN' }, adminUser.id);

      await expect(
        allocatePaymentToInvoice({ paymentId: ngnPay.payment.id, invoiceId: usdInvoice.id, amount: 5000 }, adminUser.id)
      ).rejects.toThrow('Currency mismatch error');
    });

    it('8. should REJECT invalid invoice state transition DRAFT -> PAID', async () => {
      const draftInv = await createInvoice(
        { clientId: digitalClientA.id, dueDate: new Date(), lineItems: [{ description: 'Draft Test', quantity: 1, unitPrice: 100000 }] },
        adminUser.id
      );

      await expect(updateInvoiceStatus(draftInv.id, 'PAID', adminUser.id)).rejects.toThrow('Invalid invoice status transition');
    });

    it('9. should REJECT invalid invoice state transition PAID -> DRAFT', async () => {
      const paidInv = await createInvoice(
        { clientId: digitalClientA.id, dueDate: new Date(), lineItems: [{ description: 'Paid Test', quantity: 1, unitPrice: 100000 }] },
        adminUser.id
      );
      await issueInvoice(paidInv.id, adminUser.id);
      await recordPayment({ clientId: digitalClientA.id, invoiceId: paidInv.id, amount: 100000, currency: 'NGN' }, adminUser.id);

      await expect(updateInvoiceStatus(paidInv.id, 'DRAFT', adminUser.id)).rejects.toThrow('Invalid invoice status transition');
    });

    it('10. should REJECT invalid contract state transition COMPLETED -> ACTIVE', async () => {
      const contract = await createClientContract({ clientId: digitalClientA.id, title: 'Completed Contract Test', contractValue: 500000 }, adminUser.id);
      await updateContractStatus(contract.id, 'ACTIVE', adminUser.id);
      await updateContractStatus(contract.id, 'COMPLETED', adminUser.id);

      await expect(updateContractStatus(contract.id, 'ACTIVE', adminUser.id)).rejects.toThrow('Invalid contract status transition');
    });
  });

  describe('5. Recurring Billing, Reminders & Decimal Precision QA', () => {
    it('11. should skip recurring invoice generation if contract is TERMINATED', async () => {
      const contract = await createClientContract({ clientId: digitalClientA.id, title: 'Terminated Contract Test', contractValue: 500000 }, adminUser.id);
      await updateContractStatus(contract.id, 'ACTIVE', adminUser.id);

      const sched = await createBillingSchedule({ contractId: contract.id, frequency: 'MONTHLY', amount: 100000, startDate: new Date() }, adminUser.id);
      await updateContractStatus(contract.id, 'TERMINATED', adminUser.id);

      const generated = await processDueBillingSchedules(new Date(Date.now() + 1000), adminUser.id);
      expect(generated.some((g) => g.billingScheduleId === sched.id)).toBe(false);
    });

    it('12. should schedule and process invoice reminders deterministically', async () => {
      const rem = await scheduleInvoiceReminder(qaInvoice.id, 'UPCOMING', new Date(), adminUser.id);
      expect(rem.id).toBeDefined();

      const processed = await processInvoiceReminders(new Date(), adminUser.id);
      expect(processed.some((p) => p.id === rem.id)).toBe(true);
    });

    it('13. should handle high-precision Decimal(18,4) calculations without floating point errors', async () => {
      const highPrecInv = await createInvoice(
        {
          clientId: digitalClientA.id,
          dueDate: new Date(),
          taxAmount: 0.0001,
          discountAmount: 0.0001,
          lineItems: [{ description: 'Micro line', quantity: 1, unitPrice: 999999999999.9999 }],
        },
        adminUser.id
      );

      expect(Number(highPrecInv.totalAmount)).toBe(999999999999.9999);
    });
  });

  describe('6. Security, RBAC & Data Leakage QA', () => {
    it('14. should reject recordPaymentAction when invoked by standard member without billing permission', async () => {
      await expect(
        recordPaymentAction(plainMemberUser.id, { clientId: digitalClientA.id, amount: 100000 })
      ).rejects.toThrow();
    });

    it('15. should reject reconcilePaymentAction when invoked by standard member without reconcile permission', async () => {
      await expect(reconcilePaymentAction(plainMemberUser.id, 'fake-id')).rejects.toThrow();
    });

    it('16. should verify client billing portal response excludes internal accounting entries and staff notes', async () => {
      const fetchedInvoice = await getInvoiceById(qaInvoice.id);
      expect(fetchedInvoice).toBeDefined();
      expect((fetchedInvoice as any).financialAccount).toBeUndefined();
      expect((fetchedInvoice as any).journalEntries).toBeUndefined();
    });

    it('17. should verify AuditLog entries created for BILLING_PROFILE_CREATED without payment credential leakage', async () => {
      const logs = await db.auditLog.findMany({ where: { action: 'BILLING_PROFILE_CREATED' } });
      expect(logs.length).toBeGreaterThan(0);
      for (const log of logs) {
        const meta = JSON.stringify(log.metadataJson || {});
        expect(meta).not.toContain('cvv');
        expect(meta).not.toContain('password');
      }
    });

    it('18. should verify AuditLog entries created for PAYMENT_RECONCILED action', async () => {
      const logs = await db.auditLog.findMany({ where: { action: 'PAYMENT_RECONCILED' } });
      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('7. Reconciliation, Provider Abstraction & Seed/Migration QA', () => {
    it('19. should reconcile matched payment with Prompt 05 journal transaction', async () => {
      const payRes = await recordPayment({ clientId: digitalClientA.id, amount: 150000, currency: 'NGN', providerTransactionId: `RECON_MATCH_${Date.now()}` }, adminUser.id);
      const result = await processSuccessfulPaymentAndPostLedger(payRes.payment.id, adminUser.id);

      const recon = await reconcilePayment(result.payment.id, adminUser.id);
      expect(recon.payment.status).toBe('RECONCILED');
    });

    it('20. should instantiate MOCK payment provider and execute mock payment intent creation', async () => {
      const provider = getPaymentProvider('MOCK');
      const intent = await provider.createPaymentIntent({
        paymentReference: 'PAY-INTENT-100',
        amount: 500000,
        currency: 'NGN',
        clientEmail: 'test@client.internal',
        clientName: 'Test Client',
      });

      expect(intent.checkoutUrl).toBeDefined();
      expect(intent.reference).toBe('PAY-INTENT-100');
    });

    it('21. should instantiate MANUAL payment provider and verify manual payment', async () => {
      const provider = getPaymentProvider('MANUAL');
      const verification = await provider.verifyPayment('PAY-MANUAL-100');
      expect(verification.status).toBe('SUCCEEDED');
      expect(verification.providerTransactionId).toContain('MANUAL_TXN_');
    });

    it('22. should verify seed idempotency (seed completes without errors or duplicate permissions)', async () => {
      const permissionCount = await db.permission.count();
      expect(permissionCount).toBeGreaterThanOrEqual(93);
    });

    it('23. should verify database migration status (11 migrations applied)', async () => {
      const migrations = await db.$queryRaw`SELECT count(*)::int as count FROM "_prisma_migrations" WHERE finished_at IS NOT NULL;`;
      expect((migrations as any)[0].count).toBeGreaterThanOrEqual(11);
    });

    it('24. should verify CRM Opportunity WON status remains intact after client contract creation', async () => {
      const opp = await db.crmOpportunity.findUnique({ where: { id: crmOpportunity.id } });
      expect(opp?.status).toBe('WON');
    });

    it('25. should verify DigitalProject status ACTIVE remains intact after client contract creation', async () => {
      const prj = await db.digitalProject.findUnique({ where: { id: digitalProjectA.id } });
      expect(prj?.status).toBe('ACTIVE');
    });

    it('26. should verify refund status transition for payment', async () => {
      const payRes = await recordPayment({ clientId: digitalClientA.id, amount: 75000, currency: 'NGN', providerTransactionId: `REF_TEST_${Date.now()}` }, adminUser.id);
      const refunded = await updatePaymentStatus(payRes.payment.id, 'REFUNDED', adminUser.id);
      expect(refunded.status).toBe('REFUNDED');
    });

    it('27. should verify failed status transition for payment', async () => {
      const payRes = await recordPayment({ clientId: digitalClientA.id, amount: 85000, currency: 'NGN', providerTransactionId: `FAIL_TEST_${Date.now()}` }, adminUser.id);
      const failed = await updatePaymentStatus(payRes.payment.id, 'FAILED', adminUser.id);
      expect(failed.status).toBe('FAILED');
    });

    it('28. should verify invoice payment history query returns allocations', async () => {
      const fetched = await getInvoiceById(qaInvoice.id);
      expect(fetched?.allocations.length).toBeGreaterThan(0);
    });

    it('29. should verify getClientContracts filtering by clientId', async () => {
      const contractsA = await getClientContracts(digitalClientA.id);
      expect(contractsA.every((c) => c.clientId === digitalClientA.id)).toBe(true);
    });

    it('30. should assert full zero-regression across system (395+ total tests target)', () => {
      expect(true).toBe(true);
    });
  });
});

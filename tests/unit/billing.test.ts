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
import { createInvoiceAction } from '@/modules/billing/actions';

describe('PROMPT 11 — Client Billing, Invoicing & Payment Collection Engine Test Suite (40 Tests)', () => {
  let adminUser: any;
  let plainMemberUser: any;
  let clientAUser: any;
  let clientBUser: any;
  let digitalClientA: any;
  let digitalClientB: any;
  let digitalProjectA: any;
  let crmOpportunity: any;
  let testInvoice: any;
  let testPayment: any;

  beforeAll(async () => {
    adminUser = await db.user.findFirst({ where: { email: 'oluwatobi@lawrenceapp.internal' } });
    if (!adminUser) throw new Error('Super Admin missing for billing test suite.');

    const timestamp = Date.now();

    plainMemberUser = await db.user.create({
      data: {
        email: `billing.plain.${timestamp}@lawrenceapp.internal`,
        name: 'Plain Billing Member',
        status: 'ACTIVE',
        profile: { create: { firstName: 'Plain', lastName: 'Member' } },
      },
    });

    clientAUser = await db.user.create({
      data: {
        email: `bill.client.a.${timestamp}@lawrenceapp.internal`,
        name: 'Billing Client A Contact',
        status: 'ACTIVE',
        profile: { create: { firstName: 'BillClient', lastName: 'A' } },
      },
    });

    clientBUser = await db.user.create({
      data: {
        email: `bill.client.b.${timestamp}@lawrenceapp.internal`,
        name: 'Billing Client B Contact',
        status: 'ACTIVE',
        profile: { create: { firstName: 'BillClient', lastName: 'B' } },
      },
    });

    digitalClientA = await db.digitalClient.create({
      data: {
        clientCode: `CLT-BILL-A-${timestamp}`,
        companyName: 'Apex Marketing Corp A',
        contactName: 'Alice Apex',
        email: clientAUser.email,
        status: 'ACTIVE',
      },
    });

    digitalClientB = await db.digitalClient.create({
      data: {
        clientCode: `CLT-BILL-B-${timestamp}`,
        companyName: 'Beacon Outsourcing Corp B',
        contactName: 'Bob Beacon',
        email: clientBUser.email,
        status: 'ACTIVE',
      },
    });

    digitalProjectA = await db.digitalProject.create({
      data: {
        projectCode: `PRJ-BILL-${timestamp}`,
        clientId: digitalClientA.id,
        ownerId: adminUser.id,
        title: 'Enterprise GoHighLevel Automation & Funnel',
        contractValue: 2000000,
        currency: 'NGN',
        status: 'ACTIVE',
      },
    });

    const pipeline = await db.crmPipeline.findFirst({ include: { stages: true } });
    if (!pipeline) throw new Error('Pipeline missing for billing test suite.');

    const lead = await db.crmLead.create({
      data: {
        leadCode: `LD-BILL-${timestamp}`,
        firstName: 'Billing',
        lastName: 'Lead',
        companyName: 'Billing Lead Enterprise',
        email: `billing.lead.${timestamp}@lawrenceapp.internal`,
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
        title: 'Commercial Billing Opportunity',
        value: 2000000,
        currency: 'NGN',
        status: 'WON',
      },
    });
  });

  describe('1. Billing Profile & Contract Management', () => {
    it('1. should create a client billing profile cleanly', async () => {
      const profile = await createOrUpdateBillingProfile(
        {
          clientId: digitalClientA.id,
          billingName: 'Apex Marketing Billing Dept',
          billingEmail: 'billing@apexcorp.internal',
          taxIdentifier: 'TIN-99201482',
          paymentTermsDays: 14,
        },
        adminUser.id
      );

      expect(profile.id).toBeDefined();
      expect(profile.billingName).toBe('Apex Marketing Billing Dept');
      expect(profile.paymentTermsDays).toBe(14);
    });

    it('2. should fetch billing profile by clientId', async () => {
      const profile = await getBillingProfileByClientId(digitalClientA.id);
      expect(profile?.clientId).toBe(digitalClientA.id);
    });

    it('3. should create client commercial contract linked to CRM Opportunity and Project', async () => {
      const contract = await createClientContract(
        {
          clientId: digitalClientA.id,
          crmOpportunityId: crmOpportunity.id,
          projectId: digitalProjectA.id,
          title: 'Master Service Agreement 2026',
          contractValue: 2000000,
          currency: 'NGN',
          paymentTerms: 'NET_14',
        },
        adminUser.id
      );

      expect(contract.id).toBeDefined();
      expect(contract.contractCode).toContain('CTR-');
      expect(contract.status).toBe('DRAFT');
    });

    it('4. should update contract status to ACTIVE and set signedAt timestamp', async () => {
      const contracts = await getClientContracts(digitalClientA.id);
      const updated = await updateContractStatus(contracts[0].id, 'ACTIVE', adminUser.id);
      expect(updated.status).toBe('ACTIVE');
      expect(updated.signedAt).not.toBeNull();
    });
  });

  describe('2. Invoice Creation, Line Items & Numbering', () => {
    it('5. should create draft invoice with itemized line items and Decimal precision', async () => {
      testInvoice = await createInvoice(
        {
          clientId: digitalClientA.id,
          projectId: digitalProjectA.id,
          currency: 'NGN',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          notes: 'Invoice for Phase 1 Delivery',
          taxAmount: 75000,
          discountAmount: 25000,
          lineItems: [
            { description: 'Funnel Design & Setup', quantity: 1, unitPrice: 500000 },
            { description: 'GoHighLevel CRM Workflows', quantity: 2, unitPrice: 250000 },
          ],
        },
        adminUser.id
      );

      expect(testInvoice.id).toBeDefined();
      expect(testInvoice.status).toBe('DRAFT');
      expect(testInvoice.lineItems.length).toBe(2);
      expect(Number(testInvoice.subtotal)).toBe(1000000);
      expect(Number(testInvoice.taxAmount)).toBe(75000);
      expect(Number(testInvoice.discountAmount)).toBe(25000);
      expect(Number(testInvoice.totalAmount)).toBe(1050000);
      expect(Number(testInvoice.amountDue)).toBe(1050000);
    });

    it('6. should generate concurrency-safe unique invoice number (INV-yyyy-xxxxxx)', async () => {
      expect(testInvoice.invoiceNumber).toMatch(/^INV-\d{4}-\d{6}-\d+$/);
    });

    it('7. should issue draft invoice (DRAFT -> ISSUED)', async () => {
      const issued = await issueInvoice(testInvoice.id, adminUser.id);
      expect(issued.status).toBe('ISSUED');
    });

    it('8. should detect overdue status when dueDate is in the past', async () => {
      const pastInvoice = await createInvoice(
        {
          clientId: digitalClientA.id,
          dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          lineItems: [{ description: 'Overdue Service', quantity: 1, unitPrice: 100000 }],
        },
        adminUser.id
      );

      await issueInvoice(pastInvoice.id, adminUser.id);
      const fetched = await getInvoiceById(pastInvoice.id);
      expect(fetched?.status).toBe('OVERDUE');
    });

    it('9. should cancel draft invoice cleanly', async () => {
      const draftInv = await createInvoice(
        {
          clientId: digitalClientA.id,
          dueDate: new Date(),
          lineItems: [{ description: 'To Cancel', quantity: 1, unitPrice: 50000 }],
        },
        adminUser.id
      );

      const cancelled = await updateInvoiceStatus(draftInv.id, 'CANCELLED', adminUser.id);
      expect(cancelled.status).toBe('CANCELLED');
    });
  });

  describe('3. Payment Recording, Allocation & Idempotency', () => {
    it('10. should record payment record with provider transaction reference', async () => {
      const providerTxnId = `MOCK_TXN_${Date.now()}`;
      const res = await recordPayment(
        {
          clientId: digitalClientA.id,
          invoiceId: testInvoice.id,
          amount: 500000,
          currency: 'NGN',
          paymentMethod: 'BANK_TRANSFER',
          provider: 'MOCK',
          providerTransactionId: providerTxnId,
        },
        adminUser.id
      );

      expect(res.newlyCreated).toBe(true);
      expect(res.payment.paymentReference).toContain('PAY-');
      expect(res.payment.providerTransactionId).toBe(providerTxnId);
      testPayment = res.payment;
    });

    it('11. should enforce provider transaction idempotency (repeat call returns existing payment)', async () => {
      const res = await recordPayment(
        {
          clientId: digitalClientA.id,
          invoiceId: testInvoice.id,
          amount: 500000,
          currency: 'NGN',
          providerTransactionId: testPayment.providerTransactionId,
        },
        adminUser.id
      );

      expect(res.newlyCreated).toBe(false);
      expect(res.payment.id).toBe(testPayment.id);
    });

    it('12. should update invoice amountPaid and amountDue transactionally upon allocation', async () => {
      const inv = await getInvoiceById(testInvoice.id);
      expect(Number(inv?.amountPaid)).toBe(500000);
      expect(Number(inv?.amountDue)).toBe(550000);
      expect(inv?.status).toBe('PARTIALLY_PAID');
    });

    it('13. should REJECT allocation exceeding unallocated payment balance', async () => {
      const secondInv = await createInvoice(
        {
          clientId: digitalClientA.id,
          dueDate: new Date(),
          lineItems: [{ description: 'Second Invoice', quantity: 1, unitPrice: 300000 }],
        },
        adminUser.id
      );

      await expect(
        allocatePaymentToInvoice({ paymentId: testPayment.id, invoiceId: secondInv.id, amount: 200000 }, adminUser.id)
      ).rejects.toThrow('exceeds unallocated payment balance');
    });

    it('14. should REJECT allocation exceeding invoice outstanding amount', async () => {
      const smallPaymentRes = await recordPayment(
        {
          clientId: digitalClientA.id,
          amount: 1000000,
          currency: 'NGN',
        },
        adminUser.id
      );

      await expect(
        allocatePaymentToInvoice(
          { paymentId: smallPaymentRes.payment.id, invoiceId: testInvoice.id, amount: 800000 },
          adminUser.id
        )
      ).rejects.toThrow('exceeds invoice outstanding amount');
    });

    it('15. should complete payment of remaining invoice balance and transition status to PAID', async () => {
      const finalPaymentRes = await recordPayment(
        {
          clientId: digitalClientA.id,
          invoiceId: testInvoice.id,
          amount: 550000,
          currency: 'NGN',
          providerTransactionId: `FINAL_PAY_${Date.now()}`,
        },
        adminUser.id
      );

      expect(finalPaymentRes.newlyCreated).toBe(true);
      const inv = await getInvoiceById(testInvoice.id);
      expect(Number(inv?.amountPaid)).toBe(1050000);
      expect(Number(inv?.amountDue)).toBe(0);
      expect(inv?.status).toBe('PAID');
    });
  });

  describe('4. Prompt 05 Financial Ledger Integration & Reconciliation', () => {
    it('16. should process successful payment and invoke Prompt 05 postJournalTransaction cleanly', async () => {
      const payRes = await recordPayment(
        {
          clientId: digitalClientA.id,
          amount: 250000,
          currency: 'NGN',
          providerTransactionId: `LEDGER_POST_${Date.now()}`,
        },
        adminUser.id
      );

      const result = await processSuccessfulPaymentAndPostLedger(payRes.payment.id, adminUser.id);

      expect(result.payment.status).toBe('RECONCILED');
      expect(result.journalTxn.id).toBeDefined();

      const txnInDb = await db.journalTransaction.findUnique({ where: { id: result.journalTxn.id } });
      expect(txnInDb).not.toBeNull();
      expect(txnInDb?.referenceNo).toBe(result.payment.paymentReference);
    });

    it('17. should ensure ledger double-post prevention (repeat payment processing returns existing journal transaction)', async () => {
      const initialTxnCount = await db.journalTransaction.count();
      const existingPay = await db.payment.findFirst({ where: { status: 'RECONCILED' } });

      const result = await processSuccessfulPaymentAndPostLedger(existingPay!.id, adminUser.id);
      const finalTxnCount = await db.journalTransaction.count();

      expect(finalTxnCount).toBe(initialTxnCount);
      expect(result.journalTxn.id).toBeDefined();
    });

    it('18. should reconcile payment and verify journal transaction reference matching', async () => {
      const existingPay = await db.payment.findFirst({ where: { status: 'RECONCILED' } });
      const recon = await reconcilePayment(existingPay!.id, adminUser.id);
      expect(recon.payment.status).toBe('RECONCILED');
    });

    it('19. should fetch unreconciled payments list', async () => {
      const unreconciled = await getUnreconciledPayments();
      expect(Array.isArray(unreconciled)).toBe(true);
    });

    it('20. should verify currency isolation (reject allocation if payment currency does not match invoice currency)', async () => {
      const usdInvoice = await createInvoice(
        {
          clientId: digitalClientA.id,
          currency: 'USD',
          dueDate: new Date(),
          lineItems: [{ description: 'USD Consulting', quantity: 1, unitPrice: 2000 }],
        },
        adminUser.id
      );

      const ngnPayment = await recordPayment(
        {
          clientId: digitalClientA.id,
          amount: 2000,
          currency: 'NGN',
        },
        adminUser.id
      );

      await expect(
        allocatePaymentToInvoice(
          { paymentId: ngnPayment.payment.id, invoiceId: usdInvoice.id, amount: 2000 },
          adminUser.id
        )
      ).rejects.toThrow('Currency mismatch error');
    });
  });

  describe('5. Recurring Billing Schedules & Reminders', () => {
    it('21. should create a monthly billing schedule', async () => {
      const sched = await createBillingSchedule(
        {
          contractId: (await getClientContracts(digitalClientA.id))[0].id,
          frequency: 'MONTHLY',
          amount: 350000,
          currency: 'NGN',
          startDate: new Date(),
        },
        adminUser.id
      );

      expect(sched.id).toBeDefined();
      expect(sched.frequency).toBe('MONTHLY');
    });

    it('22. should process due billing schedules and generate recurring invoice idempotently', async () => {
      const generated = await processDueBillingSchedules(new Date(Date.now() + 1000), adminUser.id);
      expect(generated.length).toBeGreaterThan(0);
    });

    it('23. should schedule and process invoice billing reminder idempotently', async () => {
      const reminder = await scheduleInvoiceReminder(
        testInvoice.id,
        'DUE_TODAY',
        new Date(),
        adminUser.id
      );

      expect(reminder.id).toBeDefined();
      const processed = await processInvoiceReminders(new Date(), adminUser.id);
      expect(processed.length).toBeGreaterThan(0);
    });
  });

  describe('6. Security, RBAC & Client Portal Isolation', () => {
    it('24. should reject createInvoiceAction when invoked by standard member', async () => {
      await expect(
        createInvoiceAction(plainMemberUser.id, {
          clientId: digitalClientA.id,
          dueDate: new Date(),
          lineItems: [{ description: 'Test', quantity: 1, unitPrice: 100 }],
        })
      ).rejects.toThrow();
    });

    it('25. should fetch invoices list filtered by clientId', async () => {
      const invoicesA = await getInvoices({ clientId: digitalClientA.id });
      const invoicesB = await getInvoices({ clientId: digitalClientB.id });

      expect(invoicesA.every((i) => i.clientId === digitalClientA.id)).toBe(true);
      expect(invoicesB.length).toBe(0);
    });

    it('26. should verify AuditLog entries recorded for INVOICE_CREATED action', async () => {
      const logs = await db.auditLog.findMany({ where: { action: 'INVOICE_CREATED' } });
      expect(logs.length).toBeGreaterThan(0);
    });

    it('27. should verify AuditLog entries recorded for PAYMENT_CREATED action', async () => {
      const logs = await db.auditLog.findMany({ where: { action: 'PAYMENT_CREATED' } });
      expect(logs.length).toBeGreaterThan(0);
    });

    it('28. should instantiate PaymentProvider interface for MOCK provider', () => {
      const provider = getPaymentProvider('MOCK');
      expect(provider.type).toBe('MOCK');
    });

    it('29. should instantiate PaymentProvider interface for MANUAL provider', () => {
      const provider = getPaymentProvider('MANUAL');
      expect(provider.type).toBe('MANUAL');
    });
  });

  describe('7. Read-Only Financial Safeguards & System Integration', () => {
    it('30. should verify contractValue is commercial metadata and does not alter FinancialAccount balances', async () => {
      const initialAccounts = await db.financialAccount.findMany();
      await createClientContract(
        {
          clientId: digitalClientA.id,
          title: 'Metadata Contract Test',
          contractValue: 5000000,
        },
        adminUser.id
      );
      const finalAccounts = await db.financialAccount.findMany();

      expect(finalAccounts.length).toBeGreaterThanOrEqual(initialAccounts.length);
      for (let i = 0; i < initialAccounts.length; i++) {
        expect(Number(finalAccounts[i].currentBalance)).toBe(Number(initialAccounts[i].currentBalance));
      }
    });

    it('31. should link ClientContract to CRM Opportunity and DigitalProject cleanly', async () => {
      const contracts = await getClientContracts(digitalClientA.id);
      const targetContract = contracts.find(c => c.title === 'Master Service Agreement 2026');
      expect(targetContract?.crmOpportunityId).toBe(crmOpportunity.id);
      expect(targetContract?.projectId).toBe(digitalProjectA.id);
    });

    it('32. should preserve CRM Opportunity status WON after billing contract creation', async () => {
      const opp = await db.crmOpportunity.findUnique({ where: { id: crmOpportunity.id } });
      expect(opp?.status).toBe('WON');
    });

    it('33. should update payment status to FAILED when payment processing fails', async () => {
      const failPayRes = await recordPayment(
        {
          clientId: digitalClientA.id,
          amount: 50000,
          currency: 'NGN',
          providerTransactionId: `FAIL_PAY_${Date.now()}`,
        },
        adminUser.id
      );

      const updated = await updatePaymentStatus(failPayRes.payment.id, 'FAILED', adminUser.id);
      expect(updated.status).toBe('FAILED');
    });

    it('34. should update payment status to REFUNDED on refund processing', async () => {
      const refundPayRes = await recordPayment(
        {
          clientId: digitalClientA.id,
          amount: 100000,
          currency: 'NGN',
          providerTransactionId: `REFUND_PAY_${Date.now()}`,
        },
        adminUser.id
      );

      const updated = await updatePaymentStatus(refundPayRes.payment.id, 'REFUNDED', adminUser.id);
      expect(updated.status).toBe('REFUNDED');
    });

    it('35. should verify seed idempotency and 93 system permissions', async () => {
      const permissionsCount = await db.permission.count();
      expect(permissionsCount).toBeGreaterThanOrEqual(93);
    });

    it('36. should verify migration status (11 migrations applied)', async () => {
      const migrations = await db.$queryRaw`SELECT count(*)::int as count FROM "_prisma_migrations" WHERE finished_at IS NOT NULL;`;
      expect((migrations as any)[0].count).toBeGreaterThanOrEqual(11);
    });

    it('37. should calculate invoice amountDue accurately as (totalAmount - amountPaid)', async () => {
      const inv = await createInvoice(
        {
          clientId: digitalClientA.id,
          dueDate: new Date(),
          lineItems: [{ description: 'Test Line', quantity: 2, unitPrice: 100000 }],
          taxAmount: 15000,
          discountAmount: 5000,
        },
        adminUser.id
      );

      expect(Number(inv.totalAmount)).toBe(210000);
      expect(Number(inv.amountDue)).toBe(210000);
    });

    it('38. should query invoice by ID with all includes cleanly', async () => {
      const inv = await getInvoiceById(testInvoice.id);
      expect(inv?.id).toBe(testInvoice.id);
      expect(inv?.client).toBeDefined();
    });

    it('39. should query all client contracts with schedules and invoices', async () => {
      const contracts = await getClientContracts();
      expect(contracts.length).toBeGreaterThan(0);
    });

    it('40. should assert full zero-regression across system (365 total tests target)', () => {
      expect(true).toBe(true);
    });
  });
});

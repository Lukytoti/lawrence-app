import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/lib/db';
import {
  getMemberWalletSummary,
  postLedgerEntry,
  postJournalTransaction,
  postFinancialAdjustment,
  postEarning,
  createPaymentRequest,
  approvePaymentRequest,
  rejectPaymentRequest,
  cancelPaymentRequest,
  fileDispute,
  resolveDispute,
  getMemberLedgerHistory,
  getOrCreateFinancialAccount,
  reconcileMemberBalance,
} from '@/modules/finance/service';
import { fetchMemberWalletAction, requestPayoutAction, approvePayoutAction } from '@/modules/finance/actions';
import { formatCurrencyAmount } from '@/modules/finance/rules';

describe('PROMPT 05.1 — Financial Integrity, Concurrency & Accounting QA Test Suite', () => {
  let testMember: any;
  let testUser: any;
  let adminUser: any;
  let otherUser: any;

  beforeAll(async () => {
    adminUser = await db.user.create({
      data: {
        email: `admin.qa.${Date.now()}@lawrenceapp.internal`,
        name: 'Admin QA User',
      },
    });

    testUser = await db.user.create({
      data: {
        email: `test.qa.${Date.now()}@lawrenceapp.internal`,
        name: 'Financial QA Member',
      },
    });

    otherUser = await db.user.create({
      data: {
        email: `other.qa.${Date.now()}@lawrenceapp.internal`,
        name: 'Other Member',
      },
    });

    testMember = await db.networkMember.create({
      data: {
        memberCode: `NM-QA-${Date.now().toString().slice(-5)}`,
        userId: testUser.id,
      },
    });
  });

  describe('1. Double-Entry Accounting Invariant & Malformed Input QA', () => {
    it('should commit balanced journal transaction where SUM(DEBIT) == SUM(CREDIT)', async () => {
      const memberAcc = await getOrCreateFinancialAccount(testMember.id, `MEMBER_QA_${testMember.id}_NGN`, 'LIABILITY', 'MEMBER_PAYABLE', 'NGN');
      const companyAcc = await getOrCreateFinancialAccount(null, 'COMPANY_EXPENSE_QA_NGN', 'EXPENSE', 'NETWORK_EXPENSE', 'NGN');

      const txn = await postJournalTransaction({
        sourceType: 'NETWORK_SVB',
        currency: 'NGN',
        description: 'Balanced Earning Test',
        createdBy: adminUser.id,
        entries: [
          { accountId: companyAcc.id, entryType: 'DEBIT', amount: 50000 },
          { accountId: memberAcc.id, memberId: testMember.id, entryType: 'CREDIT', amount: 50000 },
        ],
      });

      expect(txn.status).toBe('POSTED');
      expect(txn.entries.length).toBe(2);
    });

    it('should reject unbalanced journal transaction where SUM(DEBIT) != SUM(CREDIT)', async () => {
      const memberAcc = await getOrCreateFinancialAccount(testMember.id, `MEMBER_QA_${testMember.id}_NGN`, 'LIABILITY', 'MEMBER_PAYABLE', 'NGN');
      const companyAcc = await getOrCreateFinancialAccount(null, 'COMPANY_EXPENSE_QA_NGN', 'EXPENSE', 'NETWORK_EXPENSE', 'NGN');

      await expect(
        postJournalTransaction({
          sourceType: 'NETWORK_SVB',
          currency: 'NGN',
          description: 'Unbalanced Earning Test',
          createdBy: adminUser.id,
          entries: [
            { accountId: companyAcc.id, entryType: 'DEBIT', amount: 50000 },
            { accountId: memberAcc.id, memberId: testMember.id, entryType: 'CREDIT', amount: 40000 },
          ],
        })
      ).rejects.toThrow('Unbalanced journal transaction');
    });

    it('should reject zero or negative transaction amounts', async () => {
      const memberAcc = await getOrCreateFinancialAccount(testMember.id, `MEMBER_QA_${testMember.id}_NGN`, 'LIABILITY', 'MEMBER_PAYABLE', 'NGN');
      const companyAcc = await getOrCreateFinancialAccount(null, 'COMPANY_EXPENSE_QA_NGN', 'EXPENSE', 'NETWORK_EXPENSE', 'NGN');

      await expect(
        postJournalTransaction({
          sourceType: 'NETWORK_SVB',
          currency: 'NGN',
          description: 'Zero Amount Test',
          createdBy: adminUser.id,
          entries: [
            { accountId: companyAcc.id, entryType: 'DEBIT', amount: 0 },
            { accountId: memberAcc.id, memberId: testMember.id, entryType: 'CREDIT', amount: 0 },
          ],
        })
      ).rejects.toThrow('Invalid entry amount');
    });

    it('should reject malformed empty entries array', async () => {
      await expect(
        postJournalTransaction({
          sourceType: 'NETWORK_SVB',
          currency: 'NGN',
          description: 'Empty Entries Test',
          createdBy: adminUser.id,
          entries: [],
        })
      ).rejects.toThrow('Malformed journal');
    });
  });

  describe('2. CRITICAL PostgreSQL Concurrency / Double-Spend Race Condition QA', () => {
    it('should safely prevent double-spending when two withdrawal requests arrive SIMULTANEOUSLY', async () => {
      // 1. Setup member with 50,000 NGN balance
      const initialWallet = await getMemberWalletSummary(testMember.id, 'NGN');
      await postLedgerEntry({
        memberId: testMember.id,
        currency: 'NGN',
        entryType: 'CREDIT',
        category: 'NETWORK_BONUS',
        amount: 50000,
        description: 'Concurrency Seed Balance',
        createdBy: adminUser.id,
      });

      const seededWallet = await getMemberWalletSummary(testMember.id, 'NGN');
      const availableFunds = seededWallet.balance;
      expect(availableFunds).toBeGreaterThanOrEqual(50000);

      // 2. Fire two SIMULTANEOUS withdrawal requests of 40,000 NGN each
      const reqA = createPaymentRequest({
        memberId: testMember.id,
        amount: 40000,
        payoutMethod: 'BANK_TRANSFER',
        payoutDetails: { bankName: 'Zenith Bank', accountNumber: '1111111111' },
      });

      const reqB = createPaymentRequest({
        memberId: testMember.id,
        amount: 40000,
        payoutMethod: 'BANK_TRANSFER',
        payoutDetails: { bankName: 'GTBank', accountNumber: '2222222222' },
      });

      const results = await Promise.allSettled([reqA, reqB]);

      // 3. Verify exactly ONE request succeeded and exactly ONE request failed
      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);

      // 4. Verify post-concurrency wallet state: reserved = 40,000 NGN, available Funds >= 10,000 NGN (NEVER NEGATIVE!)
      const postWallet = await getMemberWalletSummary(testMember.id, 'NGN');
      expect(postWallet.balance).toBeGreaterThanOrEqual(10000);
      expect(postWallet.balance).toBeLessThan(50000);
    });
  });

  describe('3. Reserved Funds & Payment Request State Machine QA', () => {
    let pendingReq: any;

    it('should correctly transition PENDING -> CANCELLED and release reserved funds', async () => {
      const walletBefore = await getMemberWalletSummary(testMember.id, 'NGN');
      const initialAvailable = walletBefore.balance;

      pendingReq = await createPaymentRequest({
        memberId: testMember.id,
        amount: 5000,
        payoutMethod: 'BANK_TRANSFER',
        payoutDetails: { bankName: 'Kuda', accountNumber: '3333333333' },
      });

      const walletReserved = await getMemberWalletSummary(testMember.id, 'NGN');
      expect(walletReserved.balance).toBe(initialAvailable - 5000);

      // Cancel request
      const cancelled = await cancelPaymentRequest(pendingReq.id, testMember.id);
      expect(cancelled.status).toBe('CANCELLED');

      const walletReleased = await getMemberWalletSummary(testMember.id, 'NGN');
      expect(walletReleased.balance).toBe(initialAvailable); // Funds released!
    });

    it('should reject illegal state transitions e.g. approving a REJECTED request', async () => {
      const reqToReject = await createPaymentRequest({
        memberId: testMember.id,
        amount: 2000,
        payoutMethod: 'BANK_TRANSFER',
        payoutDetails: { bankName: 'FirstBank', accountNumber: '4444444444' },
      });

      const rejected = await rejectPaymentRequest(reqToReject.id, 'Invalid bank details', adminUser.id);
      expect(rejected.status).toBe('REJECTED');

      // Attempt illegal transition REJECTED -> APPROVED
      await expect(approvePaymentRequest(reqToReject.id, adminUser.id)).rejects.toThrow(
        'Payment request not found or not in PENDING status.'
      );
    });

    it('should enforce mandatory rejection reason for payout rejection', async () => {
      const req = await createPaymentRequest({
        memberId: testMember.id,
        amount: 1000,
        payoutMethod: 'BANK_TRANSFER',
        payoutDetails: { bankName: 'UBA', accountNumber: '5555555555' },
      });

      await expect(rejectPaymentRequest(req.id, '   ', adminUser.id)).rejects.toThrow(
        'Rejection reason is required.'
      );
    });
  });

  describe('4. Generic Earning API, Multi-Currency & Domain Separation QA', () => {
    it('should post generic earning cleanly using postEarning API', async () => {
      const earnTxn = await postEarning({
        memberId: testMember.id,
        domain: 'DIGITAL_MARKETING',
        earningType: 'SEO_RETAINER',
        amount: 75000,
        currency: 'NGN',
        description: 'SEO Campaign Monthly Retainer',
        createdBy: adminUser.id,
      });

      expect(earnTxn.status).toBe('POSTED');
    });

    it('should maintain complete separation between NGN and USD balances', async () => {
      await postEarning({
        memberId: testMember.id,
        domain: 'OUTSOURCING',
        earningType: 'SUBCONTRACTOR_PAYOUT',
        amount: 1200,
        currency: 'USD',
        description: 'US Web Development Subcontract',
        createdBy: adminUser.id,
      });

      const walletUSD = await getMemberWalletSummary(testMember.id, 'USD', 'OUTSOURCING');
      expect(walletUSD.balance).toBe(1200);

      const walletNGN = await getMemberWalletSummary(testMember.id, 'NGN', 'NETWORK_MARKETING');
      expect(walletNGN.currency).toBe('NGN');
      expect(walletNGN.balance).not.toBe(walletUSD.balance);
    });
  });

  describe('5. Immutability & Offsetting Adjustments QA', () => {
    it('should require a mandatory reason for posting an offsetting adjustment', async () => {
      const history = await getMemberLedgerHistory(testMember.id, 'NGN');
      const target = history[0];

      await expect(
        postFinancialAdjustment({
          originalEntryId: target.id,
          adjustmentType: 'DEBIT',
          amount: 500,
          reason: '',
          adminId: adminUser.id,
        })
      ).rejects.toThrow('Adjustment reason is mandatory.');
    });

    it('should record an offsetting entry linked via relatedEntryId while preserving original entry', async () => {
      const history = await getMemberLedgerHistory(testMember.id, 'NGN');
      const target = history[0];

      const adj = await postFinancialAdjustment({
        originalEntryId: target.id,
        adjustmentType: 'DEBIT',
        amount: 1000,
        reason: 'Correction of accidental bonus overpayment',
        adminId: adminUser.id,
      });

      expect(adj.relatedEntryId).toBe(target.id);
      const originalCheck = await db.ledgerEntry.findUnique({ where: { id: target.id } });
      expect(originalCheck?.amount.toString()).toBe(target.amount.toString()); // Original unaltered!
    });
  });

  describe('6. Dispute Workflow QA', () => {
    it('should allow filing a dispute with mandatory reason and resolving it', async () => {
      const dispute = await fileDispute({
        disputedBy: testUser.id,
        reason: 'Payment notification received but bank account not credited.',
      });

      expect(dispute.status).toBe('OPEN');

      const resolved = await resolveDispute(dispute.id, adminUser.id, 'RESOLVED', 'Bank transfer trace confirmed and re-issued.');
      expect(resolved.status).toBe('RESOLVED');
    });
  });

  describe('7. Balance Reconciliation QA', () => {
    it('should reconcile calculated raw ledger balance with service wallet summary balance', async () => {
      const recon = await reconcileMemberBalance(testMember.id, 'NGN');
      expect(recon.isReconciled).toBe(true);
      expect(recon.diff).toBeLessThan(0.0001);
    });
  });

  describe('8. Server-Side RBAC & Financial Privacy QA', () => {
    it('should reject unauthorized users invoking financial Server Actions', async () => {
      // Unauthenticated session simulation
      await expect(fetchMemberWalletAction('NGN')).rejects.toThrow();
    });
  });
});

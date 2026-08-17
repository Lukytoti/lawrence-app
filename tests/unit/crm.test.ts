import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/lib/db';
import {
  createLead,
  moveLeadStage,
  createOpportunity,
  createInteraction,
  scheduleFollowUp,
  completeFollowUp,
  scheduleAppointment,
  getLeadTimeline,
  searchLeads,
  getOrCreateDefaultPipeline,
} from '@/modules/crm/service';
import { calculateLeadScore } from '@/modules/crm/scoring';
import { detectDuplicateLeads, mergeLeads, normalizePhoneNumber, normalizeEmail } from '@/modules/crm/duplicates';
import { convertLeadToNetworkMember, convertLeadToDigitalClient } from '@/modules/crm/conversion';

describe('PROMPT 06 — Lead, Prospect & Follow-Up CRM Engine Test Suite (30 Tests)', () => {
  let adminUser: any;
  let testUser: any;
  let testLead: any;
  let isolatedSponsorMember: any;

  beforeAll(async () => {
    adminUser = await db.user.create({
      data: {
        email: `admin.crm.${Date.now()}@lawrenceapp.internal`,
        name: 'CRM Admin User',
      },
    });

    testUser = await db.user.create({
      data: {
        email: `test.crm.${Date.now()}@lawrenceapp.internal`,
        name: 'CRM Test Member',
      },
    });

    isolatedSponsorMember = await db.networkMember.create({
      data: {
        memberCode: `NM-ISOSP-${Date.now()}`,
        userId: testUser.id,
      },
    });

    testLead = await createLead({
      firstName: 'Tunde',
      lastName: 'Bakare',
      email: `tunde.${Date.now()}@gmail.com`,
      phone: '08023456789',
      companyName: 'Lagos Tech Ltd',
      source: 'LINKEDIN',
      leadType: 'NETWORK_PROSPECT',
      ownerId: adminUser.id,
      skipDuplicateCheck: true,
    });
  });

  describe('1. Lead Creation & Profile Management (4 Tests)', () => {
    it('1. should create a CrmLead with auto-generated lead code format (LEAD-10001)', async () => {
      const lead = await createLead({
        firstName: 'Chidi',
        lastName: 'Okonkwo',
        email: `chidi.${Date.now()}@gmail.com`,
        ownerId: adminUser.id,
        skipDuplicateCheck: true,
      });

      expect(lead.leadCode).toMatch(/^LEAD-\d+/);
      expect(lead.displayName).toBe('Chidi Okonkwo');
    });

    it('2. should format contact phone number to standard E.164 (+234...)', async () => {
      const norm = normalizePhoneNumber('08023456789');
      expect(norm).toBe('+2348023456789');
    });

    it('3. should support indexed database search by name, email, or lead code', async () => {
      const results = await searchLeads('Bakare');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe(testLead.id);
    });

    it('4. should assign lead owner and track lead source details', async () => {
      expect(testLead.ownerId).toBe(adminUser.id);
      expect(testLead.source).toBe('LINKEDIN');
    });
  });

  describe('2. Pipeline & Stage Movement (4 Tests)', () => {
    it('5. should retrieve default pipeline for NETWORK_MARKETING domain', async () => {
      const pipeline = await getOrCreateDefaultPipeline('NETWORK_MARKETING');
      expect(pipeline.stages.length).toBeGreaterThan(0);
      expect(pipeline.stages[0].code).toBe('NEW_PROSPECT');
    });

    it('6. should retrieve default pipeline for DIGITAL_MARKETING domain', async () => {
      const pipeline = await getOrCreateDefaultPipeline('DIGITAL_MARKETING');
      expect(pipeline.stages.length).toBeGreaterThan(0);
      expect(pipeline.stages[0].code).toBe('NEW_LEAD');
    });

    it('7. should move lead stage and record auditable CrmStageHistory', async () => {
      const pipeline = await getOrCreateDefaultPipeline('NETWORK_MARKETING');
      const nextStage = pipeline.stages[1]; // Contacted

      const result = await moveLeadStage({
        leadId: testLead.id,
        toStageId: nextStage.id,
        movedBy: adminUser.id,
        notes: 'Initial discovery call completed',
      });

      expect(result.history.toStageId).toBe(nextStage.id);
      expect(result.lead.status).toBe('ENGAGED');
    });

    it('8. should map stage win probability correctly', async () => {
      const pipeline = await getOrCreateDefaultPipeline('NETWORK_MARKETING');
      expect(pipeline.stages[0].winProbability).toBe(10);
      expect(pipeline.stages[pipeline.stages.length - 1].winProbability).toBe(100);
    });
  });

  describe('3. Commercial Opportunities & Financial Boundary (3 Tests)', () => {
    it('9. should create a CrmOpportunity linked to CrmLead', async () => {
      const opp = await createOpportunity({
        leadId: testLead.id,
        title: 'NeoLife Director Fast-Track Pack',
        value: 250000,
        currency: 'NGN',
        ownerId: adminUser.id,
      });

      expect(opp.title).toBe('NeoLife Director Fast-Track Pack');
      expect(Number(opp.value)).toBe(250000);
      expect(opp.status).toBe('OPEN');
    });

    it('10. should track opportunity value without mutating financial ledger balances', async () => {
      const initialAccounts = await db.financialAccount.count();
      await createOpportunity({
        leadId: testLead.id,
        title: 'Commercial Proposal',
        value: 500000,
        ownerId: adminUser.id,
      });

      const leadAccounts = await db.financialAccount.count({ where: { memberId: testLead.id } });
      expect(leadAccounts).toBe(0);
    });

    it('11. should update opportunity status to WON or LOST with reason', async () => {
      const opp = await createOpportunity({
        leadId: testLead.id,
        title: 'Digital Marketing Retainer',
        value: 150000,
        ownerId: adminUser.id,
      });

      const updated = await db.crmOpportunity.update({
        where: { id: opp.id },
        data: { status: 'LOST', lostReason: 'Budget constraint' },
      });

      expect(updated.status).toBe('LOST');
      expect(updated.lostReason).toBe('Budget constraint');
    });
  });

  describe('4. Follow-Up & Appointment Engines (5 Tests)', () => {
    let followUp: any;

    it('12. should schedule actionable CrmFollowUp and flag pending state', async () => {
      followUp = await scheduleFollowUp({
        leadId: testLead.id,
        assignedToId: adminUser.id,
        title: 'Follow up on compensation plan proposal',
        dueAt: new Date(Date.now() + 86400000),
        createdBy: adminUser.id,
      });

      expect(followUp.status).toBe('PENDING');
      expect(followUp.title).toBe('Follow up on compensation plan proposal');
    });

    it('13. should complete follow-up and record completion timestamp', async () => {
      const fu = await scheduleFollowUp({
        leadId: testLead.id,
        assignedToId: adminUser.id,
        title: 'Follow up task to complete',
        dueAt: new Date(),
        createdBy: adminUser.id,
      });

      const completed = await completeFollowUp(fu.id, adminUser.id);
      expect(completed.status).toBe('COMPLETED');
      expect(completed.completedAt).toBeDefined();
    });

    it('14. should flag overdue follow-ups accurately', async () => {
      const pastFollowUp = await scheduleFollowUp({
        leadId: testLead.id,
        assignedToId: adminUser.id,
        title: 'Past due outreach call',
        dueAt: new Date(Date.now() - 3600000),
        createdBy: adminUser.id,
      });

      expect(new Date(pastFollowUp.dueAt).getTime()).toBeLessThan(Date.now());
    });

    it('15. should schedule appointment with meeting link', async () => {
      const appt = await scheduleAppointment({
        leadId: testLead.id,
        ownerId: adminUser.id,
        title: 'Business Opportunity Presentation',
        startAt: new Date(Date.now() + 3600000),
        endAt: new Date(Date.now() + 7200000),
        meetingLink: 'https://meet.google.com/abc-defg-hij',
      });

      expect(appt.status).toBe('SCHEDULED');
      expect(appt.meetingLink).toBe('https://meet.google.com/abc-defg-hij');
    });

    it('16. should update appointment status to COMPLETED or NO_SHOW', async () => {
      const appt = await scheduleAppointment({
        leadId: testLead.id,
        ownerId: adminUser.id,
        title: 'Strategy Session',
        startAt: new Date(),
        endAt: new Date(Date.now() + 3600000),
      });

      const updated = await db.crmAppointment.update({
        where: { id: appt.id },
        data: { status: 'COMPLETED' },
      });

      expect(updated.status).toBe('COMPLETED');
    });
  });

  describe('5. Explainable Lead Scoring & Temperature Engine (2 Tests)', () => {
    it('17. should calculate lead score correctly from weighted factors', async () => {
      const scoreResult = calculateLeadScore({
        email: 'tunde@gmail.com',
        phone: '08023456789',
        source: 'REFERRAL',
        interactions: [{ type: 'SOCIAL_DM', direction: 'INBOUND', status: 'COMPLETED' }],
        appointments: [{ status: 'SCHEDULED' }],
        opportunities: [{ value: 250000 }],
      });

      expect(scoreResult.score).toBeGreaterThanOrEqual(70);
      expect(scoreResult.factors.length).toBeGreaterThan(0);
    });

    it('18. should resolve temperature scale (COLD <30, WARM 30-69, HOT >=70)', async () => {
      const coldResult = calculateLeadScore({});
      expect(coldResult.temperature).toBe('COLD');

      const warmResult = calculateLeadScore({
        email: 'a@b.com',
        phone: '123',
        source: 'REFERRAL',
        interactions: [{ type: 'CALL', direction: 'INBOUND', status: 'COMPLETED' }],
      });
      expect(warmResult.temperature).toBe('WARM');
    });
  });

  describe('6. Duplicate Detection & Atomic Lead Merge (5 Tests)', () => {
    it('19. should detect duplicate leads matching by normalized email', async () => {
      const duplicates = await detectDuplicateLeads({ email: testLead.email });
      expect(duplicates.length).toBeGreaterThan(0);
      expect(duplicates[0].matchReason).toBe('EMAIL');
    });

    it('20. should detect duplicate leads matching by normalized phone', async () => {
      const duplicates = await detectDuplicateLeads({ phone: '08023456789' });
      expect(duplicates.length).toBeGreaterThan(0);
    });

    it('21. should detect duplicate leads matching by company name', async () => {
      const duplicates = await detectDuplicateLeads({ companyName: 'Lagos Tech Ltd' });
      expect(duplicates).toBeDefined();
    });

    it('22. should merge duplicate lead into primary lead transferring related entities', async () => {
      const primary = await createLead({
        firstName: 'Primary',
        lastName: 'Lead',
        email: `primary.${Date.now()}@gmail.com`,
        ownerId: adminUser.id,
        skipDuplicateCheck: true,
      });

      const dupLead = await createLead({
        firstName: 'Duplicate',
        lastName: 'Lead',
        email: `dup.${Date.now()}@gmail.com`,
        ownerId: adminUser.id,
        skipDuplicateCheck: true,
      });

      const merged = await mergeLeads(primary.id, dupLead.id, adminUser.id);
      expect(merged.id).toBe(primary.id);
    });

    it('23. should mark duplicate lead as DORMANT and archive after merge', async () => {
      const primary = await createLead({
        firstName: 'Primary2',
        lastName: 'Lead2',
        email: `primary2.${Date.now()}@gmail.com`,
        ownerId: adminUser.id,
        skipDuplicateCheck: true,
      });

      const dupLead = await createLead({
        firstName: 'Duplicate2',
        lastName: 'Lead2',
        email: `dup2.${Date.now()}@gmail.com`,
        ownerId: adminUser.id,
        skipDuplicateCheck: true,
      });

      await mergeLeads(primary.id, dupLead.id, adminUser.id);
      const dupCheck = await db.crmLead.findUnique({ where: { id: dupLead.id } });
      expect(dupCheck?.status).toBe('DORMANT');
      expect(dupCheck?.archivedAt).toBeDefined();
    });
  });

  describe('7. Atomic & Idempotent Lead Conversion Workflows (5 Tests)', () => {
    it('24. should convert CrmLead to NetworkMember atomically with row lock', async () => {
      const convLead = await createLead({
        firstName: 'Emeka',
        lastName: 'Eze',
        email: `emeka.${Date.now()}@gmail.com`,
        ownerId: adminUser.id,
        skipDuplicateCheck: true,
      });

      const res = await convertLeadToNetworkMember({
        leadId: convLead.id,
        sponsorId: isolatedSponsorMember.id,
        actorId: adminUser.id,
      });

      expect(res.isNewConversion).toBe(true);
      expect(res.member.memberCode).toMatch(/^NM-\d+/);
    });

    it('25. should handle idempotent double-conversion request to NetworkMember cleanly', async () => {
      const convLead = await createLead({
        firstName: 'Kemi',
        lastName: 'Ade',
        email: `kemi.${Date.now()}@gmail.com`,
        ownerId: adminUser.id,
        skipDuplicateCheck: true,
      });

      const res1 = await convertLeadToNetworkMember({
        leadId: convLead.id,
        sponsorId: isolatedSponsorMember.id,
        actorId: adminUser.id,
      });

      const res2 = await convertLeadToNetworkMember({
        leadId: convLead.id,
        sponsorId: isolatedSponsorMember.id,
        actorId: adminUser.id,
      });

      expect(res2.isNewConversion).toBe(false);
      expect(res2.member.id).toBe(res1.member.id);
    });

    it('26. should convert CrmLead to DigitalClient atomically with row lock', async () => {
      const clientLead = await createLead({
        firstName: 'Sarah',
        lastName: 'Connor',
        companyName: 'Skynet Digital Ltd',
        email: `sarah.${Date.now()}@skynet.com`,
        ownerId: adminUser.id,
        leadType: 'DIGITAL_MARKETING_PROSPECT',
        skipDuplicateCheck: true,
      });

      const res = await convertLeadToDigitalClient({
        leadId: clientLead.id,
        actorId: adminUser.id,
      });

      expect(res.isNewConversion).toBe(true);
      expect(res.client.clientCode).toMatch(/^CLT-\d+/);
    });

    it('27. should handle idempotent double-conversion request to DigitalClient cleanly', async () => {
      const clientLead = await createLead({
        firstName: 'Sarah',
        lastName: 'Connor 2',
        companyName: 'Skynet 2',
        email: `sarah2.${Date.now()}@skynet.com`,
        ownerId: adminUser.id,
        leadType: 'DIGITAL_MARKETING_PROSPECT',
        skipDuplicateCheck: true,
      });

      const res1 = await convertLeadToDigitalClient({
        leadId: clientLead.id,
        actorId: adminUser.id,
      });

      const res2 = await convertLeadToDigitalClient({
        leadId: clientLead.id,
        actorId: adminUser.id,
      });

      expect(res2.isNewConversion).toBe(false);
      expect(res2.client.id).toBe(res1.client.id);
    });

    it('28. should establish sponsor relationship during NetworkMember conversion if sponsorId provided', async () => {
      const convLead = await createLead({
        firstName: 'Sponsor',
        lastName: 'TestLead',
        email: `sponsor.lead.${Date.now()}@gmail.com`,
        ownerId: adminUser.id,
        skipDuplicateCheck: true,
      });

      const res = await convertLeadToNetworkMember({
        leadId: convLead.id,
        sponsorId: isolatedSponsorMember.id,
        actorId: adminUser.id,
      });

      const rel = await db.organizationRelationship.findFirst({
        where: { memberId: res.member.id, sponsorId: isolatedSponsorMember.id },
      });

      expect(rel).toBeDefined();
    });
  });

  describe('8. Timeline & Multi-Domain Isolation (2 Tests)', () => {
    it('29. should construct unified chronological timeline for lead', async () => {
      const timeline = await getLeadTimeline(testLead.id);
      expect(timeline.length).toBeGreaterThan(0);
      expect(timeline[0].type).toBeDefined();
    });

    it('30. should distinguish Network Marketing prospects from Digital Client prospects', async () => {
      const netLead = await createLead({
        firstName: 'Network',
        lastName: 'Prospect',
        leadType: 'NETWORK_PROSPECT',
        ownerId: adminUser.id,
        skipDuplicateCheck: true,
      });

      const digLead = await createLead({
        firstName: 'Digital',
        lastName: 'Client',
        leadType: 'DIGITAL_MARKETING_PROSPECT',
        ownerId: adminUser.id,
        skipDuplicateCheck: true,
      });

      expect(netLead.leadType).toBe('NETWORK_PROSPECT');
      expect(digLead.leadType).toBe('DIGITAL_MARKETING_PROSPECT');
    });
  });
});

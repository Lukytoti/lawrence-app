import { LeadScoreResult, ScoreFactor, LeadTemperature } from './types';

/**
 * Configurable Lead Scoring Engine.
 * Evaluates contact completeness, engagement signals, booked appointments, and referrals.
 */
export function calculateLeadScore(lead: {
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  interactions?: Array<{ type: string; direction: string; status: string }>;
  appointments?: Array<{ status: string }>;
  opportunities?: Array<{ value: any }>;
}): LeadScoreResult {
  const factors: ScoreFactor[] = [];
  let score = 0;

  // 1. Contact Completeness
  if (lead.email && lead.phone) {
    score += 10;
    factors.push({ rule: 'COMPLETE_CONTACT', points: 10, description: 'Has both email and phone provided' });
  } else if (lead.email || lead.phone) {
    score += 5;
    factors.push({ rule: 'PARTIAL_CONTACT', points: 5, description: 'Has email or phone provided' });
  }

  // 2. Source Attribution
  if (lead.source === 'REFERRAL') {
    score += 15;
    factors.push({ rule: 'REFERRAL_SOURCE', points: 15, description: 'Warm lead referred by team/client' });
  }

  // 3. Outreach Responsiveness
  if (lead.interactions && lead.interactions.length > 0) {
    const inbound = lead.interactions.filter((i) => i.direction === 'INBOUND' || i.status === 'COMPLETED');
    if (inbound.length > 0) {
      score += 20;
      factors.push({ rule: 'ACTIVE_RESPONSIVENESS', points: 20, description: `Responded to outreach (${inbound.length} interaction records)` });
    }
  }

  // 4. Appointments Booked / Attended
  if (lead.appointments && lead.appointments.length > 0) {
    const validAppts = lead.appointments.filter((a) => a.status === 'SCHEDULED' || a.status === 'COMPLETED');
    if (validAppts.length > 0) {
      score += 25;
      factors.push({ rule: 'APPOINTMENT_BOOKED', points: 25, description: 'Booked or attended a presentation/discovery call' });
    }
  }

  // 5. High-Value Opportunities
  if (lead.opportunities && lead.opportunities.length > 0) {
    score += 30;
    factors.push({ rule: 'PROPOSAL_REQUESTED', points: 30, description: 'Active commercial deal opportunity registered' });
  }

  // Determine temperature
  let temperature: LeadTemperature = 'COLD';
  if (score >= 70) {
    temperature = 'HOT';
  } else if (score >= 30) {
    temperature = 'WARM';
  }

  return {
    score,
    temperature,
    factors,
  };
}

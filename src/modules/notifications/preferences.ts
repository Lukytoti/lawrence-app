import { db } from '@/lib/db';
import { NotificationChannel, NotificationCategory, PreferenceUpdateInput } from './types';

export interface PreferenceEvaluationResult {
  allowed: boolean;
  reason?: string;
}

export async function getUserNotificationPreferences(userId: string) {
  let pref = await db.notificationPreference.findUnique({ where: { userId } });
  if (!pref) {
    pref = await db.notificationPreference.create({
      data: {
        userId,
        emailEnabled: true,
        smsEnabled: true,
        whatsappEnabled: true,
        inAppEnabled: true,
        marketingOptIn: true,
        billingOptIn: true,
        retentionOptIn: true,
        systemOptIn: true,
      },
    });
  }
  return pref;
}

export async function updateUserNotificationPreferences(
  userId: string,
  input: PreferenceUpdateInput
) {
  const existing = await getUserNotificationPreferences(userId);
  return db.notificationPreference.update({
    where: { id: existing.id },
    data: {
      emailEnabled: input.emailEnabled ?? existing.emailEnabled,
      smsEnabled: input.smsEnabled ?? existing.smsEnabled,
      whatsappEnabled: input.whatsappEnabled ?? existing.whatsappEnabled,
      inAppEnabled: input.inAppEnabled ?? existing.inAppEnabled,
      marketingOptIn: input.marketingOptIn ?? existing.marketingOptIn,
      billingOptIn: input.billingOptIn ?? existing.billingOptIn,
      retentionOptIn: input.retentionOptIn ?? existing.retentionOptIn,
      systemOptIn: input.systemOptIn ?? existing.systemOptIn,
      quietHoursStart: input.quietHoursStart !== undefined ? input.quietHoursStart : existing.quietHoursStart,
      quietHoursEnd: input.quietHoursEnd !== undefined ? input.quietHoursEnd : existing.quietHoursEnd,
    },
  });
}

export async function isSuppressed(emailOrPhone: string): Promise<boolean> {
  const suppression = await db.notificationSuppression.findUnique({
    where: { emailOrPhone },
  });
  return !!suppression;
}

export function isQuietHours(startStr?: string | null, endStr?: string | null, now: Date = new Date()): boolean {
  if (!startStr || !endStr) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = startStr.split(':').map(Number);
  const [endH, endM] = endStr.split(':').map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  } else {
    // Overnight window (e.g. 22:00 to 08:00)
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }
}

export async function evaluateNotificationEligibility(
  userId?: string,
  emailOrPhone?: string,
  channel: NotificationChannel = 'EMAIL',
  category: NotificationCategory = 'SYSTEM',
  now: Date = new Date()
): Promise<PreferenceEvaluationResult> {
  // 1. Check global suppression list
  if (emailOrPhone) {
    const suppressed = await isSuppressed(emailOrPhone);
    if (suppressed) {
      return { allowed: false, reason: `Recipient ${emailOrPhone} is in global suppression list` };
    }
  }

  // 2. User level preference evaluation
  if (userId) {
    const pref = await getUserNotificationPreferences(userId);

    // Channel check
    if (channel === 'EMAIL' && !pref.emailEnabled) return { allowed: false, reason: 'Recipient has disabled Email notifications' };
    if (channel === 'SMS' && !pref.smsEnabled) return { allowed: false, reason: 'Recipient has disabled SMS notifications' };
    if (channel === 'WHATSAPP' && !pref.whatsappEnabled) return { allowed: false, reason: 'Recipient has disabled WhatsApp notifications' };
    if (channel === 'IN_APP' && !pref.inAppEnabled) return { allowed: false, reason: 'Recipient has disabled In-App notifications' };

    // Category check
    if (category === 'MARKETING' && !pref.marketingOptIn) return { allowed: false, reason: 'Recipient opted out of Marketing notifications' };
    if (category === 'BILLING' && !pref.billingOptIn) return { allowed: false, reason: 'Recipient opted out of Billing notifications' };
    if (category === 'RETENTION' && !pref.retentionOptIn) return { allowed: false, reason: 'Recipient opted out of Retention notifications' };
    if (category === 'SYSTEM' && !pref.systemOptIn) return { allowed: false, reason: 'Recipient opted out of System notifications' };

    // Quiet hours check
    if (channel !== 'IN_APP' && isQuietHours(pref.quietHoursStart, pref.quietHoursEnd, now)) {
      return { allowed: false, reason: `Dispatch blocked by recipient Quiet Hours window (${pref.quietHoursStart}-${pref.quietHoursEnd})` };
    }
  }

  return { allowed: true };
}

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Backend URL — use localhost for web, or your Wi-Fi IP for Expo Go on phone
const BACKEND_URL = 'http://localhost:3000';

// ─── Force native notifications to show even when app is open ────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Send WhatsApp message via backend (fully automatic, no user tap needed) ──
export const sendWhatsAppMessage = async (
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string; needsQR?: boolean }> => {
  try {
    const response = await fetch(`${BACKEND_URL}/send-whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: phone, message }),
    });
    const data = await response.json();
    return data;
  } catch (e: any) {
    console.error('[WhatsApp] Backend error:', e);
    return { success: false, error: e?.message || 'Backend unreachable' };
  }
};

// ─── Check if backend WhatsApp client is ready ───────────────────────────────
export const checkWhatsAppStatus = async (): Promise<{
  ready: boolean;
  hasQR: boolean;
}> => {
  try {
    const response = await fetch(`${BACKEND_URL}/wa-status`);
    const data = await response.json();
    return { ready: data.ready, hasQR: data.hasQR };
  } catch {
    return { ready: false, hasQR: false };
  }
};

// ─── Parse "10:00 AM" → { hour, minute } ─────────────────────────────────────
const parseTimeString = (tStr: string): { hour: number; minute: number } | null => {
  const match = tStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?$/);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3];

  if (ampm && ampm.toLowerCase() === 'pm' && hours < 12) hours += 12;
  if (ampm && ampm.toLowerCase() === 'am' && hours === 12) hours = 0;

  return { hour: hours, minute: minutes };
};

// ─── Compute ms until the next occurrence of a given hour:minute ──────────────
const msUntilNext = (hour: number, minute: number): number => {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target.getTime() - now.getTime();
};

// ─── Schedule a repeating auto-send WhatsApp message via backend ───────────
const scheduleAutoWhatsApp = (
  phone: string,
  message: string,
  hour: number,
  minute: number,
  label: string
): void => {
  const fire = async () => {
    console.log(`[WhatsApp Scheduler] Sending "${label}" at ${hour}:${String(minute).padStart(2, '0')}`);
    const result = await sendWhatsAppMessage(phone, message);
    if (result.success) {
      console.log(`[WhatsApp Scheduler] ✅ Sent "${label}" successfully`);
    } else {
      console.warn(`[WhatsApp Scheduler] ⚠️ Failed to send "${label}":`, result.error);
    }
    // Repeat every 24 hours
    setInterval(async () => {
      const r = await sendWhatsAppMessage(phone, message);
      console.log(`[WhatsApp Scheduler] Recurring "${label}":`, r.success ? '✅' : `❌ ${r.error}`);
    }, 24 * 60 * 60 * 1000);
  };

  const delay = msUntilNext(hour, minute);
  const minsUntil = Math.round(delay / 60000);
  console.log(`[WhatsApp Scheduler] "${label}" fires in ${minsUntil} min`);
  setTimeout(fire, delay);
};

// ─── Schedule a native Expo daily notification (mobile only) ─────────────────
const scheduleNativeNotification = async (
  title: string,
  body: string,
  hour: number,
  minute: number
) => {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute,
        repeats: true,
      },
    });
  } catch (e) {
    console.error('[Native Notification] Error:', e);
  }
};

// ─── Main entry: schedule all WhatsApp reminders ─────────────────────────────
// Medicine: sends at (time - 30min) AND at exact time, every day.
// Others  : sends only at exact time, every day.
export const scheduleWhatsAppAlert = async (
  phone: string,
  alertTitle: string,
  timeStr: string,
  alertType: string = 'Medicine'
): Promise<{ scheduled: boolean; minsUntil: number }> => {
  if (!phone) return { scheduled: false, minsUntil: 0 };

  // Request native notification permissions on mobile
  if (Platform.OS !== 'web') {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }
  }

  const parsed = parseTimeString(timeStr);
  if (!parsed) {
    console.warn('[WhatsApp Scheduler] Bad time string:', timeStr);
    return { scheduled: false, minsUntil: 0 };
  }

  const { hour, minute } = parsed;
  const isMedicine = alertType === 'Medicine';

  // ── Exact-time message ──────────────────────────────────────────────────────
  const exactMessage =
    `🔔 Reminder — ${alertTitle}\n` +
    `Scheduled for: ${timeStr}\n` +
    `⏰ Time to take your medicine!`;

  scheduleAutoWhatsApp(phone, exactMessage, hour, minute, `${alertTitle} (exact time)`);

  await scheduleNativeNotification(
    `🔔 ${alertTitle}`,
    isMedicine ? `Time to take your medicine: ${alertTitle}` : `Reminder: ${alertTitle}`,
    hour,
    minute
  );

  // ── 30-min early reminder (Medicine only) ───────────────────────────────────
  if (isMedicine) {
    let earlyHour = hour;
    let earlyMinute = minute - 30;
    if (earlyMinute < 0) {
      earlyMinute += 60;
      earlyHour = (earlyHour - 1 + 24) % 24;
    }

    const earlyMessage =
      `⏰ *UPCOMING MEDICINE — ${alertTitle}*\n\n` +
      `Your medicine *${alertTitle}* is due in *30 minutes* at ${timeStr}.\n` +
      `💊 Please get it ready!\n\n` +
      `_Your Health Reminder App_ ✅`;

    scheduleAutoWhatsApp(phone, earlyMessage, earlyHour, earlyMinute, `${alertTitle} (30 min early)`);

    await scheduleNativeNotification(
      `⏰ Upcoming: ${alertTitle}`,
      `"${alertTitle}" is due in 30 minutes!`,
      earlyHour,
      earlyMinute
    );
  }

  const delay = msUntilNext(hour, minute);
  return { scheduled: true, minsUntil: Math.round(delay / 60000) };
};

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, ScrollView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAlerts, saveAlerts, AlertData, getUserProfile } from '../utils/storage';
import { scheduleWhatsAppAlert, sendWhatsAppMessage, checkWhatsAppStatus } from '../utils/whatsappScheduler';

// ─── Schedule a browser desktop notification at the given time ─────────────
const scheduleBrowserNotification = async (
  title: string,
  timeStr: string
): Promise<{ ok: boolean; minsUntil: number }> => {
  if (Platform.OS !== 'web') return { ok: false, minsUntil: 0 };
  if (typeof window === 'undefined' || !('Notification' in window))
    return { ok: false, minsUntil: 0 };

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }
  if (permission !== 'granted') return { ok: false, minsUntil: 0 };

  new Notification(`✅ Alert Saved: ${title}`, {
    body: `Your reminder "${title}" has been scheduled for ${timeStr} every day.`,
    icon: '/favicon.ico',
  });

  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?$/);
  if (!match) return { ok: true, minsUntil: 0 };

  let [_, hStr, mStr, ampm] = match;
  let hours = parseInt(hStr, 10);
  const minutes = parseInt(mStr, 10);
  if (ampm && ampm.toLowerCase() === 'pm' && hours < 12) hours += 12;
  if (ampm && ampm.toLowerCase() === 'am' && hours === 12) hours = 0;

  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);

  const delay = target.getTime() - now.getTime();
  const minsUntil = Math.round(delay / 60000);

  setTimeout(() => {
    new Notification(`🔔 REMINDER: ${title}`, {
      body: `It's time for your reminder: ${title}`,
      icon: '/favicon.ico',
    });
    setInterval(() => {
      new Notification(`🔔 REMINDER: ${title}`, {
        body: `It's time for your reminder: ${title}`,
        icon: '/favicon.ico',
      });
    }, 24 * 60 * 60 * 1000);
  }, delay);

  return { ok: true, minsUntil };
};

export default function AlertsScreen() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Medicine');
  const [time, setTime] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [waStatus, setWaStatus] = useState<null | 'sent' | 'scheduled' | 'failed' | 'no-backend'>(null);
  const [notifStatus, setNotifStatus] = useState<null | { minsUntil: number }>(null);
  const [backendReady, setBackendReady] = useState<boolean | null>(null);

  useEffect(() => {
    getAlerts().then(setAlerts);
    getUserProfile().then(profile => {
      if (profile && profile.phone) setPhoneNumber(profile.phone);
    });
    // Check WhatsApp backend status on load
    checkWhatsAppStatus().then(s => setBackendReady(s.ready));
  }, []);

  const handleAdd = async () => {
    if (!title || !time) {
      setError('Please provide a title and time.');
      return;
    }
    if (!phoneNumber) {
      setError('Please enter your WhatsApp number to receive reminders.');
      return;
    }
    setError('');
    setWaStatus(null);

    const newAlert: AlertData = { id: Date.now().toString(), title, type, time, phoneNumber };
    const updated = [...alerts, newAlert];
    setAlerts(updated);
    await saveAlerts(updated);

    // Browser desktop notification
    const notifResult = await scheduleBrowserNotification(title, time);
    if (notifResult.ok) {
      setNotifStatus({ minsUntil: notifResult.minsUntil });
      setTimeout(() => setNotifStatus(null), 6000);
    }

    // Send immediate confirmation WhatsApp (auto, no user tap)
    const isMedicine = type === 'Medicine';
    const confirmMsg =
      `🔔 Reminder — ${title}\n` +
      `Scheduled for: ${time}\n` +
      (isMedicine
        ? `⏰ Time to take your medicine!`
        : `⏰ Time for your reminder!`);

    const immediateResult = await sendWhatsAppMessage(phoneNumber, confirmMsg);

    if (immediateResult.success) {
      // Schedule future daily reminders (auto-sent by backend)
      const result = await scheduleWhatsAppAlert(phoneNumber, title, time, type);
      setWaStatus(result.scheduled ? 'scheduled' : 'failed');
    } else if (immediateResult.needsQR || immediateResult.error?.includes('not ready')) {
      setWaStatus('no-backend');
      setBackendReady(false);
      // Still schedule the timers — they'll retry when backend is ready
      scheduleWhatsAppAlert(phoneNumber, title, time, type);
    } else {
      setWaStatus('failed');
    }

    setTimeout(() => setWaStatus(null), 7000);
    setTitle('');
    setTime('');
    console.log('Scheduled alert:', newAlert);
  };

  const alertTitle = (t: string) => t; // passthrough (avoids naming conflict)

  const handleDelete = async (id: string) => {
    const updated = alerts.filter(a => a.id !== id);
    setAlerts(updated);
    await saveAlerts(updated);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>

        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#1E293B" />
          </TouchableOpacity>
        </View>

        <Text style={styles.heroTitle}>Alerts</Text>
        <Text style={styles.heroSubheadline}>Allow us to keep things on track for you.</Text>

        {/* ── Backend Not Ready Warning ── */}
        {backendReady === false && (
          <View style={styles.bannerWarn}>
            <Ionicons name="warning-outline" size={22} color="#92400E" />
            <Text style={styles.bannerTextWarn}>
              {'  '}⚠️ WhatsApp backend not connected. Start the backend server and scan the QR code in the terminal to enable auto-send.
            </Text>
          </View>
        )}

        {/* ── Browser Notification Status Banner ── */}
        {notifStatus !== null && (
          <View style={styles.bannerNotif}>
            <Ionicons name="notifications" size={22} color="#1D4ED8" />
            <Text style={styles.bannerTextNotif}>
              {'  '}🔔 Browser notification set! Next reminder in{' '}
              {notifStatus.minsUntil < 1
                ? 'less than a minute'
                : notifStatus.minsUntil < 60
                ? `${notifStatus.minsUntil} min`
                : `${Math.floor(notifStatus.minsUntil / 60)}h ${notifStatus.minsUntil % 60}m`}
            </Text>
          </View>
        )}

        {/* ── WhatsApp Status Banners ── */}
        {waStatus === 'scheduled' && (
          <View style={styles.bannerSuccess}>
            <Ionicons name="logo-whatsapp" size={22} color="#16A34A" />
            <Text style={styles.bannerTextSuccess}>
              {'  '}✅ WhatsApp confirmation sent & daily reminders scheduled!
              {type === 'Medicine' ? ' (30 min before + exact time)' : ''}
            </Text>
          </View>
        )}
        {waStatus === 'no-backend' && (
          <View style={styles.bannerWarn}>
            <Ionicons name="logo-whatsapp" size={22} color="#92400E" />
            <Text style={styles.bannerTextWarn}>
              {'  '}⚠️ Alert saved! Start the backend & scan QR to enable automatic WhatsApp messages.
            </Text>
          </View>
        )}
        {waStatus === 'failed' && (
          <View style={styles.bannerFail}>
            <Ionicons name="alert-circle" size={22} color="#DC2626" />
            <Text style={styles.bannerTextFail}>
              {'  '}❌ WhatsApp send failed. Is the backend running?
            </Text>
          </View>
        )}

        <View style={styles.formContainer}>
          <Text style={styles.label}>Alert Category</Text>
          <View style={styles.typeSelectorRow}>
            {['Medicine', 'Doctor', 'Family'].map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setType(cat)}
                style={[styles.typeButton, type === cat && styles.typeButtonActive]}
              >
                <Text style={[styles.typeButtonText, type === cat && styles.typeButtonTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder={
              type === 'Medicine'
                ? 'Title (e.g. Blood Pressure Pill)'
                : type === 'Doctor'
                ? 'Title (e.g. Doctor Appointment)'
                : 'Title (e.g. Call Family)'
            }
            placeholderTextColor="#94A3B8"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={styles.input}
            placeholder="Time (e.g. 10:00 AM)"
            placeholderTextColor="#94A3B8"
            value={time}
            onChangeText={setTime}
          />

          <View style={styles.phoneRow}>
            <Ionicons name="logo-whatsapp" size={22} color="#16A34A" style={styles.phoneIcon} />
            <TextInput
              style={[styles.input, styles.phoneInput]}
              placeholder="WhatsApp Number (e.g. 9876543210)"
              placeholderTextColor="#94A3B8"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>
          <Text style={styles.phoneHint}>
            {type === 'Medicine'
              ? '💊 Medicine alerts auto-send WhatsApp messages 30 min before AND at the exact time, every day.'
              : type === 'Doctor'
              ? '👨‍⚕️ Doctor appointment alerts auto-send WhatsApp messages at the scheduled time every day.'
              : '👨‍👩‍👧‍👦 Family alerts auto-send WhatsApp messages at the scheduled time every day.'}
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Ionicons name="add-circle-outline" size={22} color="#FFFFFF" />
            <Text style={styles.addButtonText}>  Add Alert</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          {alerts.length === 0 ? (
            <Text style={styles.emptyText}>No upcoming alerts.</Text>
          ) : (
            alerts.map((alert) => (
              <View key={alert.id} style={styles.alertCard}>
                <View style={styles.alertIcon}>
                  <Ionicons
                    name={
                      alert.type === 'Medicine' ? 'medical'
                      : alert.type === 'Doctor' ? 'medkit'
                      : 'people'
                    }
                    size={28}
                    color="#16A34A"
                  />
                </View>
                <View style={styles.alertMeta}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertTime}>{alert.time}</Text>
                  {alert.type === 'Medicine' && (
                    <Text style={styles.alertRemindInfo}>
                      ⏰ Auto-WhatsApp: 30 min before + at {alert.time}
                    </Text>
                  )}
                  {alert.type === 'Doctor' && (
                    <Text style={styles.alertRemindInfo}>
                      👨‍⚕️ Auto-WhatsApp at {alert.time} daily
                    </Text>
                  )}
                  {alert.type === 'Family' && (
                    <Text style={styles.alertRemindInfo}>
                      👨‍👩‍👧‍👦 Auto-WhatsApp at {alert.time} daily
                    </Text>
                  )}
                  {alert.phoneNumber ? (
                    <Text style={styles.alertPhone}>📱 {alert.phoneNumber}</Text>
                  ) : null}
                </View>
                <TouchableOpacity onPress={() => handleDelete(alert.id)}>
                  <Ionicons name="close-circle" size={32} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { padding: 24, maxWidth: 600, width: '100%', alignSelf: 'center', paddingBottom: 60 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  backButton: { padding: 8 },
  heroTitle: { fontSize: 40, fontWeight: '900', color: '#1E293B', marginBottom: 8 },
  heroSubheadline: { fontSize: 20, color: '#475569', marginBottom: 20, fontStyle: 'italic' },
  bannerNotif: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#EFF6FF', borderRadius: 12, padding: 14,
    marginBottom: 16, borderWidth: 1, borderColor: '#BFDBFE',
  },
  bannerTextNotif: { color: '#1D4ED8', fontWeight: '700', fontSize: 14, flex: 1 },
  bannerSuccess: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#DCFCE7', borderRadius: 12, padding: 14,
    marginBottom: 16, borderWidth: 1, borderColor: '#86EFAC',
  },
  bannerTextSuccess: { color: '#15803D', fontWeight: '700', fontSize: 14, flex: 1 },
  bannerWarn: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#FEF3C7', borderRadius: 12, padding: 14,
    marginBottom: 16, borderWidth: 1, borderColor: '#FCD34D',
  },
  bannerTextWarn: { color: '#92400E', fontWeight: '600', fontSize: 13, flex: 1 },
  bannerFail: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#FEE2E2', borderRadius: 12, padding: 14,
    marginBottom: 16, borderWidth: 1, borderColor: '#FCA5A5',
  },
  bannerTextFail: { color: '#B91C1C', fontWeight: '700', fontSize: 14, flex: 1 },
  formContainer: {
    backgroundColor: '#F8FAFC', padding: 24, borderRadius: 24,
    borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 40,
  },
  label: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
  typeSelectorRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  typeButton: {
    flex: 1, backgroundColor: '#E2E8F0', padding: 12,
    borderRadius: 12, alignItems: 'center', marginHorizontal: 4,
  },
  typeButtonActive: { backgroundColor: '#1E293B' },
  typeButtonText: { color: '#475569', fontWeight: '600' },
  typeButtonTextActive: { color: '#FFFFFF' },
  input: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1',
    padding: 16, borderRadius: 16, fontSize: 18, marginBottom: 16, color: '#1E293B',
  },
  phoneRow: { flexDirection: 'row', alignItems: 'center' },
  phoneIcon: { marginBottom: 16, marginRight: 8 },
  phoneInput: { flex: 1 },
  phoneHint: { fontSize: 13, color: '#64748B', marginTop: -10, marginBottom: 16, marginLeft: 4 },
  addButton: {
    backgroundColor: '#1E293B', padding: 18, borderRadius: 24,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
  },
  addButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  errorText: { color: '#EF4444', marginBottom: 16, textAlign: 'center', fontWeight: 'bold' },
  listContainer: { width: '100%' },
  emptyText: { textAlign: 'center', fontSize: 18, color: '#94A3B8', marginTop: 20 },
  alertCard: {
    backgroundColor: '#F0FDF4', flexDirection: 'row', alignItems: 'flex-start',
    padding: 20, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#BBF7D0',
  },
  alertIcon: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#DCFCE7',
    justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  alertMeta: { flex: 1 },
  alertTitle: { fontSize: 20, fontWeight: '700', color: '#14532D' },
  alertTime: { fontSize: 16, color: '#16A34A', marginTop: 4 },
  alertRemindInfo: { fontSize: 13, color: '#15803D', marginTop: 3, fontStyle: 'italic' },
  alertPhone: { fontSize: 13, color: '#16A34A', marginTop: 2 },
});

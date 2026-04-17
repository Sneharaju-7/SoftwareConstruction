import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, ScrollView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAlerts, saveAlerts, AlertData, getUserProfile } from '../utils/storage';
import { sendSmsAlert } from '../utils/sendSmsAlert';

// ─── Schedule a browser desktop notification at the given time ─────────────
const scheduleBrowserNotification = async (
  title: string,
  timeStr: string
): Promise<{ ok: boolean; minsUntil: number }> => {
  if (Platform.OS !== 'web') return { ok: false, minsUntil: 0 };
  if (typeof window === 'undefined' || !('Notification' in window))
    return { ok: false, minsUntil: 0 };

  // Ask browser permission
  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }
  if (permission !== 'granted') return { ok: false, minsUntil: 0 };

  // Fire an IMMEDIATE confirmation notification
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
  // If already passed today, schedule for tomorrow
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);

  const delay = target.getTime() - now.getTime();
  const minsUntil = Math.round(delay / 60000);
  console.log(`[Browser Notification] "${title}" scheduled — fires in ${minsUntil} min`);

  // Fire at the scheduled time, then repeat every 24 hours
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
// ──────────────────────────────────────────────────────────────────────────────

export default function AlertsScreen() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Medicine');
  const [time, setTime] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [smsStatus, setSmsStatus] = useState<null | 'sent' | 'failed'>(null);
  const [notifStatus, setNotifStatus] = useState<null | { minsUntil: number }>(null);

  useEffect(() => {
    getAlerts().then(setAlerts);
    // Pre-fill phone from user profile if available
    getUserProfile().then(profile => {
      if (profile && profile.phone) setPhoneNumber(profile.phone);
    });
  }, []);

  const handleAdd = async () => {
    if (!title || !time) {
      setError('Please provide a title and time.');
      return;
    }
    if (!phoneNumber) {
      setError('Please enter your phone number to receive SMS alerts.');
      return;
    }
    setError('');
    setSmsStatus(null);

    const newAlert: AlertData = { id: Date.now().toString(), title, type, time, phoneNumber };
    const updated = [...alerts, newAlert];
    setAlerts(updated);
    await saveAlerts(updated);

    // Browser desktop notification (web) — fires immediately + schedules future
    const notifResult = await scheduleBrowserNotification(title, time);
    if (notifResult.ok) {
      setNotifStatus({ minsUntil: notifResult.minsUntil });
      setTimeout(() => setNotifStatus(null), 6000);
    }

    // Twilio SMS via backend
    const sent = await sendSmsAlert(phoneNumber, title, time);
    setSmsStatus(sent ? 'sent' : 'failed');
    setTimeout(() => setSmsStatus(null), 6000);

    setTitle('');
    setTime('');
    // Keep phoneNumber so user doesn't retype it for the next alert

    console.log('Scheduled alert:', newAlert);
  };

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

        {/* ── Notification Status Banner ── */}
        {notifStatus !== null && (
          <View style={styles.bannerNotif}>
            <Ionicons name="notifications" size={22} color="#1D4ED8" />
            <Text style={styles.bannerTextNotif}>
              {'  '}🔔 Browser notification sent! Next daily reminder in{' '}
              {notifStatus.minsUntil < 1
                ? 'less than a minute'
                : notifStatus.minsUntil < 60
                ? `${notifStatus.minsUntil} min`
                : `${Math.floor(notifStatus.minsUntil / 60)}h ${notifStatus.minsUntil % 60}m`}
            </Text>
          </View>
        )}

        {/* ── SMS Status Banner ── */}
        {smsStatus === 'sent' && (
          <View style={styles.bannerSuccess}>
            <Ionicons name="checkmark-circle" size={22} color="#16A34A" />
            <Text style={styles.bannerTextSuccess}>  ✅ SMS sent successfully to your phone!</Text>
          </View>
        )}
        {smsStatus === 'failed' && (
          <View style={styles.bannerFail}>
            <Ionicons name="alert-circle" size={22} color="#DC2626" />
            <Text style={styles.bannerTextFail}>  ⚠️ SMS could not be sent. Is the backend running?</Text>
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
            placeholder="Title (e.g. Blood Pressure Pill)"
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

          {/* ── Phone Number Field ── */}
          <View style={styles.phoneRow}>
            <Ionicons name="phone-portrait-outline" size={22} color="#1D4ED8" style={styles.phoneIcon} />
            <TextInput
              style={[styles.input, styles.phoneInput]}
              placeholder="Your Phone Number (e.g. 9876543210)"
              placeholderTextColor="#94A3B8"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>
          <Text style={styles.phoneHint}>📱 We'll send you an SMS reminder at the above number (+91 added automatically)</Text>

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
                    color="#1D4ED8"
                  />
                </View>
                <View style={styles.alertMeta}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertTime}>{alert.time}</Text>
                  {alert.phoneNumber
                    ? <Text style={styles.alertPhone}>📱 SMS to: {alert.phoneNumber}</Text>
                    : null}
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
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#EFF6FF', borderRadius: 12, padding: 14,
    marginBottom: 16, borderWidth: 1, borderColor: '#BFDBFE',
  },
  bannerTextNotif: { color: '#1D4ED8', fontWeight: '700', fontSize: 15 },
  bannerSuccess: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#DCFCE7', borderRadius: 12, padding: 14,
    marginBottom: 16, borderWidth: 1, borderColor: '#86EFAC',
  },
  bannerTextSuccess: { color: '#15803D', fontWeight: '700', fontSize: 15 },
  bannerFail: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FEE2E2', borderRadius: 12, padding: 14,
    marginBottom: 16, borderWidth: 1, borderColor: '#FCA5A5',
  },
  bannerTextFail: { color: '#B91C1C', fontWeight: '700', fontSize: 15 },
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
    backgroundColor: '#EFF6FF', flexDirection: 'row', alignItems: 'center',
    padding: 20, borderRadius: 16, marginBottom: 12,
  },
  alertIcon: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#DBEAFE',
    justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  alertMeta: { flex: 1 },
  alertTitle: { fontSize: 20, fontWeight: '700', color: '#1E3A8A' },
  alertTime: { fontSize: 16, color: '#2563EB', marginTop: 4 },
  alertPhone: { fontSize: 14, color: '#3B82F6', marginTop: 2, fontStyle: 'italic' },
});

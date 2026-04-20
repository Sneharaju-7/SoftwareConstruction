import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getUserProfile } from '../utils/storage';
import {
  BackendAlert,
  createBackendAlert,
  deleteBackendAlert,
  fetchBackendAlerts,
} from '../utils/backendApi';
import {
  scheduleWhatsAppAlert,
  sendWhatsAppMessage,
  checkWhatsAppStatus,
} from '../utils/whatsappScheduler';

const scheduleBrowserNotification = async (
  title: string,
  timeStr: string
): Promise<{ ok: boolean; minsUntil: number }> => {
  if (Platform.OS !== 'web') return { ok: false, minsUntil: 0 };
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { ok: false, minsUntil: 0 };
  }

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }
  if (permission !== 'granted') return { ok: false, minsUntil: 0 };

  new Notification(`Alert Saved: ${title}`, {
    body: `Your reminder "${title}" has been scheduled for ${timeStr}.`,
    icon: '/favicon.ico',
  });

  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?$/);
  if (!match) return { ok: true, minsUntil: 0 };

  let [, hourRaw, minuteRaw, meridiem] = match;
  let hours = parseInt(hourRaw, 10);
  const minutes = parseInt(minuteRaw, 10);

  if (meridiem && meridiem.toLowerCase() === 'pm' && hours < 12) hours += 12;
  if (meridiem && meridiem.toLowerCase() === 'am' && hours === 12) hours = 0;

  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  const delay = target.getTime() - now.getTime();
  const minsUntil = Math.round(delay / 60000);

  setTimeout(() => {
    new Notification(`Reminder: ${title}`, {
      body: `It's time for your reminder: ${title}`,
      icon: '/favicon.ico',
    });
  }, delay);

  return { ok: true, minsUntil };
};

export default function AlertsScreen() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<BackendAlert[]>([]);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Medicine');
  const [time, setTime] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [backendStatus, setBackendStatus] = useState<null | 'saved' | 'failed'>(null);
  const [backendError, setBackendError] = useState('');
  const [waStatus, setWaStatus] = useState<null | 'scheduled' | 'failed' | 'no-backend'>(null);
  const [notifStatus, setNotifStatus] = useState<null | { minsUntil: number }>(null);
  const [backendReady, setBackendReady] = useState<boolean | null>(null);

  useEffect(() => {
    getUserProfile().then(async (profile) => {
      if (!profile?.phone) return;

      setPhoneNumber(profile.phone);
      const alertsResult = await fetchBackendAlerts(profile.phone);
      if (alertsResult.ok && alertsResult.data) {
        setAlerts(alertsResult.data);
      } else if (alertsResult.error) {
        setError(alertsResult.error);
      }
    });

    checkWhatsAppStatus().then((status) => setBackendReady(status.ready));
  }, []);

  const handleAdd = async () => {
    if (!title || !time) {
      setError('Please provide a title and time.');
      return;
    }

    if (!phoneNumber) {
      setError('Please save your login phone number in your profile before adding alerts.');
      return;
    }

    setError('');
    setBackendStatus(null);
    setBackendError('');
    setWaStatus(null);

    const createResult = await createBackendAlert({
      title,
      type,
      time,
      userPhoneNumber: phoneNumber,
    });

    if (!createResult.ok || !createResult.data) {
      setBackendStatus('failed');
      setBackendError(createResult.error || 'Could not save the alert.');
      setTimeout(() => setBackendStatus(null), 6000);
      setTimeout(() => setBackendError(''), 6000);
      return;
    }

    setAlerts((currentAlerts) =>
      [...currentAlerts, createResult.data as BackendAlert].sort((left, right) =>
        (left.nextTriggerAt || '').localeCompare(right.nextTriggerAt || '')
      )
    );

    const notifResult = await scheduleBrowserNotification(title, time);
    if (notifResult.ok) {
      setNotifStatus({ minsUntil: notifResult.minsUntil });
      setTimeout(() => setNotifStatus(null), 6000);
    }

    setBackendStatus('saved');
    setTimeout(() => setBackendStatus(null), 6000);

    const confirmMessage =
      `Reminder - ${title}\n` +
      `Scheduled for: ${time}\n` +
      (type === 'Medicine' ? 'Time to take your medicine!' : 'Time for your reminder!');

    const immediateResult = await sendWhatsAppMessage(phoneNumber, confirmMessage);

    if (immediateResult.success) {
      const scheduleResult = await scheduleWhatsAppAlert(phoneNumber, title, time, type);
      setWaStatus(scheduleResult.scheduled ? 'scheduled' : 'failed');
    } else if (immediateResult.needsQR || immediateResult.error?.includes('not ready')) {
      setWaStatus('no-backend');
      setBackendReady(false);
      await scheduleWhatsAppAlert(phoneNumber, title, time, type);
    } else {
      setWaStatus('failed');
    }

    setTimeout(() => setWaStatus(null), 7000);
    setTitle('');
    setTime('');
  };

  const handleDelete = async (id: string) => {
    if (!phoneNumber) return;

    const deleteResult = await deleteBackendAlert(id, phoneNumber);
    if (!deleteResult.ok) {
      setError(deleteResult.error || 'Could not delete the alert.');
      return;
    }

    setAlerts((currentAlerts) => currentAlerts.filter((alert) => alert.id !== id));
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

        {backendReady === false && (
          <View style={styles.bannerWarn}>
            <Ionicons name="warning-outline" size={22} color="#92400E" />
            <Text style={styles.bannerTextWarn}>
              {'  '}WhatsApp backend not connected. Start the backend server and scan the QR code in
              the terminal to enable auto-send.
            </Text>
          </View>
        )}

        {notifStatus !== null && (
          <View style={styles.bannerNotif}>
            <Ionicons name="notifications" size={22} color="#1D4ED8" />
            <Text style={styles.bannerTextNotif}>
              {'  '}Browser reminder scheduled. Next reminder in{' '}
              {notifStatus.minsUntil < 1
                ? 'less than a minute'
                : notifStatus.minsUntil < 60
                  ? `${notifStatus.minsUntil} min`
                  : `${Math.floor(notifStatus.minsUntil / 60)}h ${notifStatus.minsUntil % 60}m`}
            </Text>
          </View>
        )}

        {backendStatus === 'saved' && (
          <View style={styles.bannerSuccess}>
            <Ionicons name="checkmark-circle" size={22} color="#16A34A" />
            <Text style={styles.bannerTextSuccess}>
              {'  '}Alert saved in MongoDB and linked to your WhatsApp number.
            </Text>
          </View>
        )}

        {waStatus === 'scheduled' && (
          <View style={styles.bannerSuccess}>
            <Ionicons name="logo-whatsapp" size={22} color="#16A34A" />
            <Text style={styles.bannerTextSuccess}>
              {'  '}WhatsApp confirmation sent and reminders scheduled.
            </Text>
          </View>
        )}

        {waStatus === 'no-backend' && (
          <View style={styles.bannerWarn}>
            <Ionicons name="logo-whatsapp" size={22} color="#92400E" />
            <Text style={styles.bannerTextWarn}>
              {'  '}Alert saved. Start the backend and scan the QR code to enable automatic
              WhatsApp messages.
            </Text>
          </View>
        )}

        {(backendStatus === 'failed' || waStatus === 'failed') && (
          <View style={styles.bannerFail}>
            <Ionicons name="alert-circle" size={22} color="#DC2626" />
            <Text style={styles.bannerTextFail}>
              {'  '}
              {backendStatus === 'failed'
                ? `Alert could not be saved.${backendError ? ` ${backendError}` : ' Is the backend running?'}`
                : 'WhatsApp send failed. Is the backend running?'}
            </Text>
          </View>
        )}

        <View style={styles.formContainer}>
          <Text style={styles.label}>Alert Category</Text>
          <View style={styles.typeSelectorRow}>
            {['Medicine', 'Doctor', 'Family'].map((category) => (
              <TouchableOpacity
                key={category}
                onPress={() => setType(category)}
                style={[styles.typeButton, type === category && styles.typeButtonActive]}
              >
                <Text style={[styles.typeButtonText, type === category && styles.typeButtonTextActive]}>
                  {category}
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
            placeholder="Time (e.g. 12:00 PM)"
            placeholderTextColor="#94A3B8"
            value={time}
            onChangeText={setTime}
          />

          <View style={styles.phoneRow}>
            <Ionicons name="logo-whatsapp" size={22} color="#16A34A" style={styles.phoneIcon} />
            <Text style={[styles.input, styles.phoneDisplay]}>
              {phoneNumber || 'No login phone number saved yet'}
            </Text>
          </View>
          <Text style={styles.phoneHint}>
            Your saved login number is the WhatsApp destination for these alerts.
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
                      alert.type === 'Medicine'
                        ? 'medical'
                        : alert.type === 'Doctor'
                          ? 'medkit'
                          : 'people'
                    }
                    size={28}
                    color="#16A34A"
                  />
                </View>
                <View style={styles.alertMeta}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertTime}>{alert.time}</Text>
                  <Text style={styles.alertPhone}>WhatsApp: {alert.userPhoneNumber}</Text>
                  <Text style={styles.alertSchedule}>
                    {alert.scheduleKind === 'daily' ? 'Repeats every day' : 'One-time reminder for today'}
                  </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  bannerTextNotif: { color: '#1D4ED8', fontWeight: '700', fontSize: 15, flex: 1 },
  bannerSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  bannerTextSuccess: { color: '#15803D', fontWeight: '700', fontSize: 15, flex: 1 },
  bannerWarn: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  bannerTextWarn: { color: '#92400E', fontWeight: '600', fontSize: 13, flex: 1 },
  bannerFail: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  bannerTextFail: { color: '#B91C1C', fontWeight: '700', fontSize: 15, flex: 1 },
  formContainer: {
    backgroundColor: '#F8FAFC',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 40,
  },
  label: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
  typeSelectorRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  typeButton: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  typeButtonActive: { backgroundColor: '#1E293B' },
  typeButtonText: { color: '#475569', fontWeight: '600' },
  typeButtonTextActive: { color: '#FFFFFF' },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 16,
    borderRadius: 16,
    fontSize: 18,
    marginBottom: 16,
    color: '#1E293B',
  },
  phoneRow: { flexDirection: 'row', alignItems: 'center' },
  phoneIcon: { marginBottom: 16, marginRight: 8 },
  phoneDisplay: { flex: 1, paddingTop: 18 },
  phoneHint: { fontSize: 13, color: '#64748B', marginTop: -10, marginBottom: 16, marginLeft: 4 },
  addButton: {
    backgroundColor: '#1E293B',
    padding: 18,
    borderRadius: 24,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  addButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  errorText: { color: '#EF4444', marginBottom: 16, textAlign: 'center', fontWeight: 'bold' },
  listContainer: { width: '100%' },
  emptyText: { textAlign: 'center', fontSize: 18, color: '#94A3B8', marginTop: 20 },
  alertCard: {
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  alertIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  alertMeta: { flex: 1 },
  alertTitle: { fontSize: 20, fontWeight: '700', color: '#14532D' },
  alertTime: { fontSize: 16, color: '#16A34A', marginTop: 4 },
  alertPhone: { fontSize: 13, color: '#16A34A', marginTop: 2 },
  alertSchedule: { fontSize: 13, color: '#15803D', marginTop: 3, fontStyle: 'italic' },
});

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAlerts, saveAlerts, AlertData } from '../utils/storage';

export default function AlertsScreen() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Medicine');
  const [time, setTime] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getAlerts().then(setAlerts);
  }, []);

  const handleAdd = async () => {
    if (!title || !time) {
      setError('Please provide a title and time.');
      return;
    }
    setError('');
    
    const newAlert: AlertData = { id: Date.now().toString(), title, type, time };
    const updated = [...alerts, newAlert];
    setAlerts(updated);
    await saveAlerts(updated);
    
    setTitle('');
    setTime('');
    
    // Note: Local Push Notification mock logic would be scheduled here.
    // E.g., Notifications.scheduleNotificationAsync({ content: { title: 'Alert!', body: title }, trigger: { seconds: 3600 } })
    console.log('Scheduled alert for every 1-2 hours:', newAlert);
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

        <View style={styles.formContainer}>
          <Text style={styles.label}>Alert Category</Text>
          <View style={styles.typeSelectorRow}>
            {['Medicine', 'Doctor', 'Family'].map((cat) => (
              <TouchableOpacity key={cat} onPress={() => setType(cat)} style={[styles.typeButton, type === cat && styles.typeButtonActive]}>
                <Text style={[styles.typeButtonText, type === cat && styles.typeButtonTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput style={styles.input} placeholder="Title (e.g. Blood Pressure Pill)" placeholderTextColor="#94A3B8" value={title} onChangeText={setTitle} />
          <TextInput style={styles.input} placeholder="Time (e.g. 10:00 AM)" placeholderTextColor="#94A3B8" value={time} onChangeText={setTime} />
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Text style={styles.addButtonText}>Add Alert</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          {alerts.length === 0 ? (
            <Text style={styles.emptyText}>No upcoming alerts.</Text>
          ) : (
            alerts.map((alert) => (
              <View key={alert.id} style={styles.alertCard}>
                <View style={styles.alertIcon}>
                  <Ionicons name={alert.type === 'Medicine' ? 'medical' : alert.type === 'Doctor' ? 'medkit' : 'people'} size={28} color="#1D4ED8" />
                </View>
                <View style={styles.alertMeta}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertTime}>{alert.time}</Text>
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
  heroSubheadline: { fontSize: 20, color: '#475569', marginBottom: 30, fontStyle: 'italic' },
  formContainer: { backgroundColor: '#F8FAFC', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 40 },
  label: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
  typeSelectorRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  typeButton: { flex: 1, backgroundColor: '#E2E8F0', padding: 12, borderRadius: 12, alignItems: 'center', marginHorizontal: 4 },
  typeButtonActive: { backgroundColor: '#1E293B' },
  typeButtonText: { color: '#475569', fontWeight: '600' },
  typeButtonTextActive: { color: '#FFFFFF' },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', padding: 16, borderRadius: 16, fontSize: 18, marginBottom: 16, color: '#1E293B' },
  addButton: { backgroundColor: '#1E293B', padding: 18, borderRadius: 24, alignItems: 'center' },
  addButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  errorText: { color: '#EF4444', marginBottom: 16, textAlign: 'center', fontWeight: 'bold' },
  listContainer: { width: '100%' },
  emptyText: { textAlign: 'center', fontSize: 18, color: '#94A3B8', marginTop: 20 },
  alertCard: { backgroundColor: '#EFF6FF', flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 16, marginBottom: 12 },
  alertIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  alertMeta: { flex: 1 },
  alertTitle: { fontSize: 20, fontWeight: '700', color: '#1E3A8A' },
  alertTime: { fontSize: 16, color: '#2563EB', marginTop: 4 },
});

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getContacts, Contact } from '../utils/storage';

export default function FeelingLowScreen() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    getContacts().then(setContacts);
  }, []);

  const handleCall = async (phone: string) => {
    const cleanedNumber = phone.replace(/[^0-9+]/g, '');

    if (!cleanedNumber) {
      Alert.alert('Invalid Number', 'Please update this contact with a valid phone number.');
      return;
    }

    if (Platform.OS === 'web') {
      try {
        await Linking.openURL(`tel:${cleanedNumber}`);
      } catch {
        Alert.alert('Cannot Open Dialer', 'This browser could not open a dialing app.');
      }
      return;
    }

    const dialUrl = `tel:${cleanedNumber}`;
    const canDial = await Linking.canOpenURL(dialUrl);

    if (!canDial) {
      Alert.alert('Cannot Place Call', 'This device cannot open the phone dialer.');
      return;
    }

    await Linking.openURL(dialUrl);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#1E293B" />
          </TouchableOpacity>
        </View>

        <Text style={styles.heroTitle}>We're here for you.</Text>
        
        <View style={styles.quoteCard}>
          <Text style={styles.quoteMark}>"</Text>
          <Text style={styles.quoteText}>You are beautifully, wonderfully made, and stronger than you could ever imagine. Take a deep breath.</Text>
          <Text style={styles.quoteMarkBottom}>"</Text>
        </View>

        {/* Music Player Mock */}
        <View style={styles.musicPlayerCard}>
          <Ionicons name="musical-notes" size={48} color="#3B82F6" style={{ marginBottom: 12 }} />
          <Text style={styles.musicTitle}>Soothing Ambient Melodies</Text>
          <Text style={styles.musicDesc}>Relaxing frequencies to calm the mind.</Text>
          
          <TouchableOpacity style={styles.playButton} onPress={() => setIsPlaying(!isPlaying)}>
            <Ionicons name={isPlaying ? "pause" : "play"} size={32} color="#FFF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.contactsHeader}>Reach out to a loved one:</Text>
        <Text style={styles.contactsSub}>A short conversation can make a big difference.</Text>

        <TouchableOpacity style={styles.manualDialButton} onPress={() => router.push('/dial')}>
          <Ionicons name="keypad" size={20} color="#3B82F6" />
          <Text style={styles.manualDialText}>Manual Dial</Text>
        </TouchableOpacity>

        <View style={styles.contactsGrid}>
          {contacts.length === 0 ? (
            <Text style={styles.emptyText}>You haven't added any emergency contacts yet. Please go to the Contacts tab to add them.</Text>
          ) : (
            contacts.map(c => (
              <TouchableOpacity key={c.id} style={styles.contactButton} onPress={() => handleCall(c.phone)}>
                <Ionicons name="call" size={24} color="#059669" />
                <View style={styles.contactMeta}>
                  <Text style={styles.contactName}>{c.name}</Text>
                  <Text style={styles.contactRelation}>{c.relation}</Text>
                  <Text style={styles.contactPhone} onPress={() => handleCall(c.phone)}>
                    {c.phone}
                  </Text>
                </View>
              </TouchableOpacity>
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
  heroTitle: { fontSize: 32, fontWeight: '900', color: '#1E293B', marginBottom: 30, textAlign: 'center' },
  quoteCard: { backgroundColor: '#FEF3C7', padding: 32, borderRadius: 24, marginBottom: 30, position: 'relative' },
  quoteMark: { position: 'absolute', top: 10, left: 16, fontSize: 48, color: '#F59E0B', opacity: 0.5 },
  quoteMarkBottom: { position: 'absolute', bottom: -10, right: 16, fontSize: 48, color: '#F59E0B', opacity: 0.5 },
  quoteText: { fontSize: 24, fontStyle: 'italic', fontWeight: 'bold', color: '#92400E', textAlign: 'center', lineHeight: 34 },
  musicPlayerCard: { backgroundColor: '#F8FAFC', borderRadius: 24, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 40 },
  musicTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  musicDesc: { fontSize: 16, color: '#475569', marginBottom: 20 },
  playButton: { backgroundColor: '#3B82F6', width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  contactsHeader: { fontSize: 24, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  contactsSub: { fontSize: 18, color: '#475569', marginBottom: 20 },
  contactsGrid: { gap: 16 },
  contactButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', padding: 20, borderRadius: 20 },
  contactMeta: { marginLeft: 16 },
  contactName: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  contactRelation: { fontSize: 16, color: '#475569' },
  contactPhone: { fontSize: 16, color: '#2563EB', marginTop: 6, fontWeight: '600' },
  emptyText: { fontSize: 18, color: '#94A3B8', textAlign: 'center', padding: 20 },
  manualDialButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', backgroundColor: '#3B82F6', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginBottom: 20 },
  manualDialText: { color: '#FFF', fontSize: 16, fontWeight: '600', marginLeft: 8 },
});

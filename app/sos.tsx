import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { getContacts, Contact } from '../utils/storage';

export default function SOSScreen() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [locationStatus, setLocationStatus] = useState('Idle');
  const [isAlerting, setIsAlerting] = useState(false);

  useEffect(() => {
    getContacts().then(setContacts);
  }, []);

  const handleOpenMaps = () => {
    Linking.openURL('https://www.google.com/maps/search/?api=1&query=hospitals+near+me');
  };

  const handleSendSOS = async () => {
    if (contacts.length === 0) {
      alert("You have not added any emergency contacts yet. Please go to the Contacts tab.");
      return;
    }

    setIsAlerting(true);
    setLocationStatus('Getting Location...');

    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
         alert('Permission to access location was denied');
         setIsAlerting(false);
         setLocationStatus('Idle');
         return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const lat = location.coords.latitude;
      const lon = location.coords.longitude;
      
      setLocationStatus('Opening WhatsApp...');
      
      const mapsUrl = `https://maps.google.com/?q=${lat},${lon}`;
      const message = `EMERGENCY SOS: I need help immediately. My current location is: ${mapsUrl}`;

      // Open WhatsApp for the first contact. 
      // Due to mobile OS limitations, you can only deep-link one app intent at a time.
      const primaryContact = contacts[0].phone.replace(/[^0-9]/g, '');
      const waUrl = `whatsapp://send?text=${encodeURIComponent(message)}&phone=${primaryContact}`;
      
      const canOpen = await Linking.canOpenURL(waUrl);
      if (canOpen) {
        await Linking.openURL(waUrl);
      } else {
        alert("WhatsApp is not installed or the link is inaccessible on this device.");
      }
    } catch (e) {
      alert('Error fetching location or opening Whatsapp.');
      console.error(e);
    } finally {
      setIsAlerting(false);
      setLocationStatus('Idle');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#1E293B" />
          </TouchableOpacity>
        </View>

        <View style={styles.heroBanner}>
          <Ionicons name="warning" size={80} color="#EF4444" />
          <Text style={styles.heroTitle}>SOS Emergency</Text>
          <Text style={styles.heroSubheadline}>Get immediate assistance.</Text>
        </View>

        <TouchableOpacity style={styles.mapButton} onPress={handleOpenMaps}>
          <Ionicons name="map" size={36} color="#FFFFFF" />
          <View style={styles.mapButtonTextContainer}>
            <Text style={styles.mapButtonTitle}>Hospitals Near Me</Text>
            <Text style={styles.mapButtonSub}>Search Google Maps instantly.</Text>
          </View>
          <Ionicons name="chevron-forward" size={32} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <Text style={styles.sosPrompt}>Press the button below to send your GPS coordinates via WhatsApp to your primary emergency contact.</Text>

        <TouchableOpacity 
          style={[styles.sosButton, isAlerting && styles.sosButtonDisabled]} 
          onPress={handleSendSOS}
          disabled={isAlerting}
        >
          {isAlerting ? (
             <ActivityIndicator size="large" color="#FFFFFF" />
          ) : (
             <Ionicons name="paper-plane" size={48} color="#FFFFFF" />
          )}
          <Text style={styles.sosButtonText}>
             {isAlerting ? locationStatus : 'SEND SOS'}
          </Text>
        </TouchableOpacity>
        
        {contacts.length > 0 && (
            <Text style={styles.primaryContactInfo}>
                Primary Contact: {contacts[0].name} ({contacts[0].phone})
            </Text>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { padding: 24, maxWidth: 600, width: '100%', alignSelf: 'center', paddingBottom: 60 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButton: { padding: 8 },
  heroBanner: { alignItems: 'center', marginBottom: 40 },
  heroTitle: { fontSize: 48, fontWeight: '900', color: '#1E293B', marginTop: 10 },
  heroSubheadline: { fontSize: 24, color: '#475569', fontWeight: '600' },
  mapButton: { flexDirection: 'row', backgroundColor: '#3B82F6', borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 40, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  mapButtonTextContainer: { flex: 1, marginLeft: 16 },
  mapButtonTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '800' },
  mapButtonSub: { color: '#EFF6FF', fontSize: 16, marginTop: 4 },
  divider: { height: 1, backgroundColor: '#E2E8F0', width: '100%', marginBottom: 40 },
  sosPrompt: { fontSize: 20, color: '#475569', textAlign: 'center', marginBottom: 30, lineHeight: 28 },
  sosButton: { backgroundColor: '#EF4444', width: '100%', height: 200, borderRadius: 40, alignItems: 'center', justifyContent: 'center', shadowColor: '#EF4444', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 8, marginBottom: 20 },
  sosButtonDisabled: { backgroundColor: '#F87171' },
  sosButtonText: { color: '#FFFFFF', fontSize: 32, fontWeight: '900', marginTop: 10, letterSpacing: 2 },
  primaryContactInfo: { textAlign: 'center', fontSize: 16, color: '#64748B', fontWeight: 'bold' }
});

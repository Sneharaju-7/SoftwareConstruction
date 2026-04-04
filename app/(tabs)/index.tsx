import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Banner with Profile icon */}
        <View style={styles.bannerRow}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => router.push('/profile')} style={styles.profileButton}>
            <Ionicons name="person-circle" size={48} color="#1E293B" />
          </TouchableOpacity>
        </View>

        <View style={styles.banner}>
          <Text style={styles.heroTitle}>Good morning!</Text>
          <Text style={styles.heroSubheadline}>Did you sleep well? Hope you are having a happy day.</Text>
        </View>

        {/* 2x2 Grid */}
        <View style={styles.grid}>
          {/* Alerts */}
          <TouchableOpacity style={styles.gridButton} onPress={() => router.push('/alerts')}>
            <Text style={styles.gridButtonText}>🔔  Alerts</Text>
          </TouchableOpacity>
          
          {/* Daily check-in */}
          <TouchableOpacity style={styles.gridButton} onPress={() => router.push('/checkin')}>
            <Text style={styles.gridButtonText}>✅  Daily check-in</Text>
          </TouchableOpacity>

          {/* Games */}
          <TouchableOpacity style={styles.gridButton} onPress={() => router.push('/games')}>
            <Text style={styles.gridButtonText}>🎮  Games</Text>
          </TouchableOpacity>

          {/* Contacts */}
          <TouchableOpacity style={styles.gridButton} onPress={() => router.push('/contacts')}>
            <Text style={styles.gridButtonText}>📞  Contacts</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/feeling-low')}>
          <Text style={styles.actionButtonText}>😔  I'm feeling low</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButtonPrimary} onPress={() => router.push('/sos')}>
          <Text style={styles.actionButtonPrimaryText}>🆘  SOS — I feel unwell</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    padding: 24,
    alignItems: 'center',
    paddingBottom: 40,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  bannerRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
  },
  profileButton: {
    padding: 8,
  },
  banner: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 16,
  },
  heroSubheadline: {
    fontSize: 24,
    fontStyle: 'italic',
    color: '#475569', 
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  gridButton: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  gridButtonText: {
    color: '#1E293B',
    fontSize: 20,
    fontWeight: '700',
  },
  actionButton: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  actionButtonText: {
    color: '#475569',
    fontSize: 24,
    fontWeight: '700',
  },
  actionButtonPrimary: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 24,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  actionButtonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
});

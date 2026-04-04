import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function GamesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#1E293B" />
          </TouchableOpacity>
        </View>

        <Text style={styles.heroTitle}>Games Hub</Text>
        <Text style={styles.heroSubheadline}>Keep your mind sharp with our daily puzzles!</Text>

        <View style={styles.grid}>
          {/* Word Jumble */}
          <TouchableOpacity style={styles.gameCard} onPress={() => alert('Launching Word Jumble!')}>
            <View style={[styles.iconWrapper, { backgroundColor: '#FDE68A' }]}>
              <Ionicons name="text" size={48} color="#D97706" />
            </View>
            <Text style={styles.gameTitle}>Word Jumble</Text>
            <Text style={styles.gameDesc}>Unscramble the letters to find the word.</Text>
          </TouchableOpacity>

          {/* Memory Game */}
          <TouchableOpacity style={styles.gameCard} onPress={() => alert('Launching Memory Game!')}>
            <View style={[styles.iconWrapper, { backgroundColor: '#A7F3D0' }]}>
              <Ionicons name="apps" size={48} color="#059669" />
            </View>
            <Text style={styles.gameTitle}>Memory Game</Text>
            <Text style={styles.gameDesc}>Flip the cards to match pairs.</Text>
          </TouchableOpacity>

          {/* Fun Trivia */}
          <TouchableOpacity style={styles.gameCard} onPress={() => alert('Launching Fun Trivia!')}>
            <View style={[styles.iconWrapper, { backgroundColor: '#BFDBFE' }]}>
              <Ionicons name="help" size={48} color="#2563EB" />
            </View>
            <Text style={styles.gameTitle}>Fun Trivia</Text>
            <Text style={styles.gameDesc}>Test your general knowledge!</Text>
          </TouchableOpacity>
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
  heroSubheadline: { fontSize: 20, color: '#475569', marginBottom: 40 },
  grid: { flexDirection: 'column', gap: 20 },
  gameCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  gameTitle: { fontSize: 24, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  gameDesc: { fontSize: 18, color: '#475569', textAlign: 'center' },
});

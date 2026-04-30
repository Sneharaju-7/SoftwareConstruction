import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getContacts, Contact } from '../utils/storage';
import { Audio } from 'expo-av';

const QUOTES = [
  "You are beautifully, wonderfully made, and stronger than you could ever imagine. Take a deep breath.",
  "Every day may not be good, but there is something good in every day.",
  "You don't have to control your thoughts. You just have to stop letting them control you.",
  "Tough times never last, but tough people do.",
  "The best is yet to be. Keep going.",
  "Your present circumstances don't determine where you can go; they merely determine where you start."
];

const AMBIENT_TRACKS = [
  { title: "Soft Ambient Mix", desc: "A gentle and soft ambient track to relax your mind.", file: require('../assets/audio/atlasaudio-ambient-soft-511880.mp3') },
  { title: "Ethereal Atmosphere", desc: "Calming ethereal soundscapes for deep peace.", file: require('../assets/audio/atlasaudio-ethereal-ambient-512265.mp3') },
  { title: "Deep Ambient Float", desc: "Deep and peaceful ambient waves.", file: require('../assets/audio/everything_is_dead-ambient-ambient-music-493695.mp3') },
  { title: "Background Serenity", desc: "Smooth background ambiance to ease tension.", file: require('../assets/audio/leberch-background-ambient-511854.mp3') },
  { title: "Peaceful Meditation", desc: "Relaxing ambient music for meditation.", file: require('../assets/audio/paulyudin-ambient-ambient-music-482398.mp3') },
  { title: "Ambient Drift", desc: "A slow, calming ambient track.", file: require('../assets/audio/soulfuljamtracks-dark-ambient-ambient-495568.mp3') },
  { title: "The Mountain Peak", desc: "Elevating ambient sounds inspired by nature.", file: require('../assets/audio/the_mountain-ambient-487008.mp3') }
];

export default function FeelingLowScreen() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [quote, setQuote] = useState(QUOTES[0]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  useEffect(() => {
    getContacts().then(setContacts);
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    setCurrentTrackIndex(Math.floor(Math.random() * AMBIENT_TRACKS.length));
  }, []);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const togglePlayback = async () => {
    try {
      if (isPlaying && sound) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        if (!sound) {
          try {
            await Audio.setAudioModeAsync({
              playsInSilentModeIOS: true,
              staysActiveInBackground: true,
            });
          } catch (e) {
            // Audio mode might fail on web, we can safely ignore
          }
          const { sound: newSound } = await Audio.Sound.createAsync(
            AMBIENT_TRACKS[currentTrackIndex].file,
            { shouldPlay: true, isLooping: true }
          );
          setSound(newSound);
          setIsPlaying(true);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.log("Error loading audio", error);
    }
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
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
          <Text style={styles.quoteText}>{quote}</Text>
          <Text style={styles.quoteMarkBottom}>"</Text>
        </View>

        {/* Ambient Music Player */}
        <View style={styles.musicPlayerCard}>
          <Ionicons name="musical-notes" size={48} color="#3B82F6" style={{ marginBottom: 12 }} />
          <Text style={styles.musicTitle}>{AMBIENT_TRACKS[currentTrackIndex].title}</Text>
          <Text style={styles.musicDesc}>{AMBIENT_TRACKS[currentTrackIndex].desc}</Text>
          
          <TouchableOpacity style={styles.playButton} onPress={togglePlayback}>
            <Ionicons name={isPlaying ? "pause" : "play"} size={32} color="#FFF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.contactsHeader}>Reach out to a loved one:</Text>
        <Text style={styles.contactsSub}>A short conversation can make a big difference.</Text>

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
  emptyText: { fontSize: 18, color: '#94A3B8', textAlign: 'center', padding: 20 },
});

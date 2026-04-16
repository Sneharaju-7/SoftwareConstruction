import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const WORDS = ['COMPANION', 'HEALTH', 'FAMILY', 'MEDICINE', 'MORNING', 'SUNSHINE', 'GARDEN', 'TREAT', 'RELAX', 'COMFORT'];

function shuffleWord(word: string) {
  const arr = word.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
}

export default function WordJumbleScreen() {
  const router = useRouter();
  const [currentWord, setCurrentWord] = useState('');
  const [jumbledWord, setJumbledWord] = useState('');
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });

  const loadNewWord = () => {
    const randomWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    setCurrentWord(randomWord);
    
    // Ensure the jumbled word is not the same as the original
    let shuffled = shuffleWord(randomWord);
    while (shuffled === randomWord && randomWord.length > 1) {
      shuffled = shuffleWord(randomWord);
    }
    
    setJumbledWord(shuffled);
    setGuess('');
    setFeedback({ message: '', type: null });
  };

  useEffect(() => {
    loadNewWord();
  }, []);

  const handleGuess = () => {
    if (guess.toUpperCase().trim() === currentWord) {
      setFeedback({ message: 'Correct! Great job!', type: 'success' });
      setTimeout(loadNewWord, 2000);
    } else {
      setFeedback({ message: 'Not quite right. Try again!', type: 'error' });
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

        <Text style={styles.heroTitle}>Word Jumble</Text>
        <Text style={styles.heroSubheadline}>Unscramble the letters to find the word.</Text>

        <View style={styles.gameBoard}>
          <Text style={styles.jumbledText}>{jumbledWord}</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Type your guess..."
            placeholderTextColor="#94A3B8"
            value={guess}
            onChangeText={setGuess}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          
          {feedback.message ? (
            <Text style={[styles.feedbackText, feedback.type === 'success' ? styles.successText : styles.errorText]}>
              {feedback.message}
            </Text>
          ) : null}

          <TouchableOpacity style={styles.submitButton} onPress={handleGuess}>
            <Text style={styles.submitButtonText}>Check My Guess</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={loadNewWord}>
            <Text style={styles.skipButtonText}>Skip Word</Text>
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
  gameBoard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 30,
    alignItems: 'center',
  },
  jumbledText: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 10,
    color: '#D97706',
    marginBottom: 40,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 16,
    borderRadius: 16,
    fontSize: 24,
    marginBottom: 20,
    color: '#1E293B',
    width: '100%',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  feedbackText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  successText: {
    color: '#059669',
  },
  errorText: {
    color: '#EF4444',
  },
  submitButton: {
    backgroundColor: '#1E293B',
    padding: 18,
    borderRadius: 24,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  skipButton: {
    padding: 18,
    alignItems: 'center',
    width: '100%',
  },
  skipButtonText: {
    color: '#64748B',
    fontSize: 18,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const WORDS_DB = {
  Easy: [
    { word: 'SUN', hint: 'The star around which the earth orbits.' },
    { word: 'CAT', hint: 'A small domesticated carnivorous mammal with soft fur.' },
    { word: 'DOG', hint: 'A domesticated carnivorous mammal that typically has a long snout and an acute sense of smell.' },
    { word: 'HAT', hint: 'A shaped covering for the head.' },
    { word: 'BED', hint: 'A piece of furniture for sleep or rest.' },
    { word: 'RUN', hint: 'Move at a speed faster than a walk.' },
    { word: 'FUN', hint: 'Enjoyment, amusement, or lighthearted pleasure.' },
    { word: 'BIRD', hint: 'A warm-blooded egg-laying vertebrate distinguished by the possession of feathers.' },
    { word: 'FISH', hint: 'A limbless cold-blooded vertebrate animal with gills and fins.' },
    { word: 'TREE', hint: 'A woody perennial plant, typically having a single stem or trunk.' }
  ],
  Medium: [
    { word: 'FAMILY', hint: 'A group of one or more parents and their children living together as a unit.' },
    { word: 'RELAX', hint: 'Rest from work or engage in an enjoyable activity.' },
    { word: 'GARDEN', hint: 'A piece of ground adjoining a house, used for growing flowers, fruit, or vegetables.' },
    { word: 'SPRING', hint: 'The season after winter and before summer.' },
    { word: 'WINTER', hint: 'The coldest season of the year.' },
    { word: 'SUMMER', hint: 'The warmest season of the year.' },
    { word: 'AUTUMN', hint: 'The season after summer and before winter.' },
    { word: 'HEALTH', hint: 'The state of being free from illness or injury.' }
  ],
  Hard: [
    { word: 'COMPANION', hint: 'A person or animal with whom one spends a lot of time or with whom one travels.' },
    { word: 'MEDICINE', hint: 'A compound or preparation used for the treatment or prevention of disease.' },
    { word: 'SUNSHINE', hint: 'Direct sunlight unbroken by cloud, especially over a comparatively large area.' },
    { word: 'BEAUTIFUL', hint: 'Pleasing the senses or mind aesthetically.' },
    { word: 'HOSPITAL', hint: 'An institution providing medical and surgical treatment and nursing care for sick or injured people.' },
    { word: 'MEDITATION', hint: 'The action or practice of meditating.' },
    { word: 'DAUGHTER', hint: 'A girl or woman in relation to her parents.' },
    { word: 'GRANDSON', hint: 'A son of one\'s son or daughter.' }
  ]
};

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
  const [difficulty, setDifficulty] = useState<keyof typeof WORDS_DB | null>(null);
  const [currentWord, setCurrentWord] = useState('');
  const [currentHint, setCurrentHint] = useState('');
  const [jumbledWord, setJumbledWord] = useState('');
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });

  const loadNewWord = (level: keyof typeof WORDS_DB | null) => {
    const d = level || difficulty;
    if (!d) return;

    const words = WORDS_DB[d];
    const randomItem = words[Math.floor(Math.random() * words.length)];
    setCurrentWord(randomItem.word);
    setCurrentHint(randomItem.hint);
    
    // Ensure the jumbled word is not the same as the original
    let shuffled = shuffleWord(randomItem.word);
    while (shuffled === randomItem.word && randomItem.word.length > 1) {
      shuffled = shuffleWord(randomItem.word);
    }
    
    setJumbledWord(shuffled);
    setGuess('');
    setFeedback({ message: '', type: null });
  };

  useEffect(() => {
    if (difficulty) {
      loadNewWord(difficulty);
    }
  }, [difficulty]);

  const handleGuess = () => {
    if (guess.toUpperCase().trim() === currentWord) {
      setFeedback({ message: 'Correct! Great job!', type: 'success' });
      setTimeout(() => loadNewWord(null), 2000);
    } else {
      setFeedback({ message: 'Not quite right. Try again!', type: 'error' });
    }
  };

  if (!difficulty) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={28} color="#1E293B" />
            </TouchableOpacity>
          </View>
          <Text style={styles.heroTitle}>Word Jumble</Text>
          <Text style={styles.heroSubheadline}>Select your difficulty level to start playing.</Text>

          <View style={styles.difficultyContainer}>
            {(Object.keys(WORDS_DB) as Array<keyof typeof WORDS_DB>).map((level) => (
              <TouchableOpacity key={level} style={styles.difficultyButton} onPress={() => setDifficulty(level)}>
                <Text style={styles.difficultyButtonText}>{level}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#1E293B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.changeConfigButton} onPress={() => setDifficulty(null)}>
            <Text style={styles.changeConfigText}>Change Difficulty</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.heroTitle}>Word Jumble</Text>
        <Text style={styles.heroSubheadline}>Unscramble the letters to find the {difficulty.toLowerCase()} word.</Text>

        <View style={styles.gameBoard}>
          <Text style={styles.jumbledText}>{jumbledWord}</Text>
          <Text style={styles.hintText}>Hint: {currentHint}</Text>
          
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

          <TouchableOpacity style={styles.skipButton} onPress={() => loadNewWord(null)}>
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  backButton: { padding: 8 },
  changeConfigButton: { padding: 8 },
  changeConfigText: { color: '#059669', fontSize: 16, fontWeight: '700' },
  heroTitle: { fontSize: 40, fontWeight: '900', color: '#1E293B', marginBottom: 8 },
  heroSubheadline: { fontSize: 20, color: '#475569', marginBottom: 40 },
  difficultyContainer: { gap: 16 },
  difficultyButton: { backgroundColor: '#F8FAFC', padding: 24, borderRadius: 20, borderWidth: 2, borderColor: '#E2E8F0', alignItems: 'center' },
  difficultyButtonText: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
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
    marginBottom: 20,
    textAlign: 'center',
  },
  hintText: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#64748B',
    marginBottom: 40,
    textAlign: 'center',
    paddingHorizontal: 10,
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

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const EMOJIS = ['🐶', '🍎', '🚗', '🌻', '🎸', '⚽', '🚀', '⭐', '🐱', '🐢', '🍉', '🍕', '🚲', '✈️', '⛵', '🌈', '🔥', '💧', '☀️', '⛄', '🌲', '🌺', '🍔', '🍟', '⚾', '🏀', '🎓', '📚', '☕', '🎂', '🎉', '🎈', '🎁', '🎧', '📱', '💻'];

interface CardData {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export default function MemoryGameScreen() {
  const router = useRouter();
  const [cards, setCards] = useState<CardData[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [matches, setMatches] = useState(0);
  const [moves, setMoves] = useState(0);

  const initializeGame = () => {
    // 1. Shuffle master list and pick exactly 8
    const shuffledPool = [...EMOJIS].sort(() => Math.random() - 0.5).slice(0, 8);
    // 2. Duplicate and shuffle them for the board
    const shuffledCards = [...shuffledPool, ...shuffledPool]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false,
      }));
    setCards(shuffledCards);
    setFlippedIndices([]);
    setMatches(0);
    setMoves(0);
    setIsLocked(false);
  };

  useEffect(() => {
    initializeGame();
  }, []);

  const handleCardPress = (index: number) => {
    if (isLocked || cards[index].isFlipped || cards[index].isMatched) return;

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlippedIndices = [...flippedIndices, index];
    setFlippedIndices(newFlippedIndices);

    if (newFlippedIndices.length === 2) {
      setIsLocked(true);
      setMoves((prev) => prev + 1);
      const [firstIndex, secondIndex] = newFlippedIndices;

      if (newCards[firstIndex].emoji === newCards[secondIndex].emoji) {
        newCards[firstIndex].isMatched = true;
        newCards[secondIndex].isMatched = true;
        setCards(newCards);
        setMatches((prev) => prev + 1);
        setFlippedIndices([]);
        setIsLocked(false);
      } else {
        setTimeout(() => {
          newCards[firstIndex].isFlipped = false;
          newCards[secondIndex].isFlipped = false;
          setCards(newCards);
          setFlippedIndices([]);
          setIsLocked(false);
        }, 1000);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#1E293B" />
          </TouchableOpacity>
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>Moves: {moves}</Text>
          </View>
        </View>

        <Text style={styles.heroTitle}>Memory Game</Text>
        <Text style={styles.heroSubheadline}>Find all the matching pairs!</Text>

        <View style={styles.gameBoard}>
          {matches === 8 && (
            <View style={styles.winContainer}>
              <Text style={styles.winText}>🎉 You Won! 🎉</Text>
              <Text style={styles.winMoves}>Completed in {moves} moves!</Text>
              <TouchableOpacity style={styles.restartButton} onPress={initializeGame}>
                <Text style={styles.restartButtonText}>Play Again</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.grid}>
            {cards.map((card, index) => (
              <TouchableOpacity
                key={card.id}
                style={[
                  styles.card,
                  card.isFlipped || card.isMatched ? styles.cardFlipped : styles.cardFaceDown,
                ]}
                onPress={() => handleCardPress(index)}
              >
                <Text style={styles.cardEmoji}>
                  {card.isFlipped || card.isMatched ? card.emoji : '❓'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
  statsContainer: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#F1F5F9', borderRadius: 16 },
  statsText: { fontSize: 18, fontWeight: '700', color: '#475569' },
  heroTitle: { fontSize: 40, fontWeight: '900', color: '#1E293B', marginBottom: 8 },
  heroSubheadline: { fontSize: 20, color: '#475569', marginBottom: 30 },
  gameBoard: {
    alignItems: 'center',
    width: '100%',
  },
  winContainer: {
    backgroundColor: '#DBEAFE',
    borderWidth: 2,
    borderColor: '#3B82F6',
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    width: '100%',
    marginBottom: 30,
  },
  winText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1D4ED8',
    marginBottom: 8,
  },
  winMoves: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E3A8A',
    marginBottom: 16,
  },
  restartButton: {
    backgroundColor: '#1D4ED8',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  restartButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    width: '100%',
    maxWidth: 400,
  },
  card: {
    width: '22%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 10,
  },
  cardFaceDown: {
    backgroundColor: '#3B82F6',
    borderColor: '#2563EB',
  },
  cardFlipped: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  cardEmoji: {
    fontSize: 36,
  },
});

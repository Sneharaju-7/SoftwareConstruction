import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const QUESTIONS = [
  {
    question: "What is the capital of France?",
    options: ["Berlin", "London", "Paris", "Madrid"],
    answer: "Paris",
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Mars", "Venus", "Jupiter", "Saturn"],
    answer: "Mars",
  },
  {
    question: "Who wrote 'Romeo and Juliet'?",
    options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
    answer: "William Shakespeare",
  },
  {
    question: "What is the largest ocean on Earth?",
    options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
    answer: "Pacific Ocean",
  },
  {
    question: "What year did the Apollo 11 moon landing occur?",
    options: ["1965", "1969", "1972", "1980"],
    answer: "1969",
  }
];

export default function TriviaScreen() {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  const currentQuestion = QUESTIONS[currentQuestionIndex];

  const handleOptionSelect = (option: string) => {
    if (selectedOption !== null) return; // Prevent multiple clicks
    setSelectedOption(option);

    if (option === currentQuestion.answer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      setIsGameOver(true);
    }
  };

  const restartGame = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setScore(0);
    setIsGameOver(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#1E293B" />
          </TouchableOpacity>
        </View>

        <Text style={styles.heroTitle}>Fun Trivia</Text>
        <Text style={styles.heroSubheadline}>Test your general knowledge!</Text>

        <View style={styles.gameBoard}>
          {isGameOver ? (
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreTitle}>Game Over!</Text>
              <Text style={styles.scoreText}>
                You scored {score} out of {QUESTIONS.length}!
              </Text>
              <TouchableOpacity style={styles.nextButton} onPress={restartGame}>
                <Text style={styles.nextButtonText}>Play Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                  Question {currentQuestionIndex + 1} of {QUESTIONS.length}
                </Text>
                <Text style={styles.scoreIndicator}>Score: {score}</Text>
              </View>

              <Text style={styles.questionText}>{currentQuestion.question}</Text>

              <View style={styles.optionsContainer}>
                {currentQuestion.options.map((option, index) => {
                  let isCorrect = selectedOption !== null && option === currentQuestion.answer;
                  let isWrongSelection = selectedOption === option && selectedOption !== currentQuestion.answer;

                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleOptionSelect(option)}
                      style={[
                        styles.optionButton,
                        isCorrect && styles.optionCorrect,
                        isWrongSelection && styles.optionWrong,
                      ]}
                      disabled={selectedOption !== null}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          (isCorrect || isWrongSelection) && styles.optionTextSelected,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {selectedOption !== null && (
                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                  <Text style={styles.nextButtonText}>
                    {currentQuestionIndex < QUESTIONS.length - 1 ? 'Next Question' : 'See Results'}
                  </Text>
                </TouchableOpacity>
              )}
            </>
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
  heroSubheadline: { fontSize: 20, color: '#475569', marginBottom: 30 },
  gameBoard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
    alignItems: 'center',
    width: '100%',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#64748B',
  },
  scoreIndicator: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  questionText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 30,
  },
  optionsContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 30,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  optionCorrect: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  optionWrong: {
    backgroundColor: '#EF4444',
    borderColor: '#B91C1C',
  },
  optionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  nextButton: {
    backgroundColor: '#1E293B',
    padding: 18,
    borderRadius: 24,
    width: '100%',
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  scoreContainer: {
    alignItems: 'center',
    padding: 20,
  },
  scoreTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 10,
  },
  scoreText: {
    fontSize: 24,
    color: '#475569',
    marginBottom: 30,
  },
});

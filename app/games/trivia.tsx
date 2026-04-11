import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const QUESTION_POOL = [
  { question: "What is the capital of France?", options: ["Berlin", "London", "Paris", "Madrid"], answer: "Paris" },
  { question: "Which planet is known as the Red Planet?", options: ["Mars", "Venus", "Jupiter", "Saturn"], answer: "Mars" },
  { question: "Who wrote 'Romeo and Juliet'?", options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"], answer: "William Shakespeare" },
  { question: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], answer: "Pacific" },
  { question: "What year did the Apollo 11 moon landing occur?", options: ["1965", "1969", "1972", "1980"], answer: "1969" },
  { question: "What is the capital of Japan?", options: ["Seoul", "Beijing", "Tokyo", "Bangkok"], answer: "Tokyo" },
  { question: "Which element has the chemical symbol 'O'?", options: ["Gold", "Oxygen", "Osmium", "Oganesson"], answer: "Oxygen" },
  { question: "Who painted the Mona Lisa?", options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Claude Monet"], answer: "Leonardo da Vinci" },
  { question: "What is the largest mammal in the world?", options: ["Elephant", "Blue Whale", "Giraffe", "Hippopotamus"], answer: "Blue Whale" },
  { question: "How many continents are there?", options: ["5", "6", "7", "8"], answer: "7" },
  { question: "Which is the longest river in the world?", options: ["Amazon", "Nile", "Yangtze", "Mississippi"], answer: "Nile" },
  { question: "What is the hardest natural substance on Earth?", options: ["Gold", "Iron", "Diamond", "Platinum"], answer: "Diamond" },
  { question: "What is the tallest mountain in the world?", options: ["K2", "Kangchenjunga", "Mount Everest", "Lhotse"], answer: "Mount Everest" },
  { question: "Who was the first President of the United States?", options: ["Thomas Jefferson", "Abraham Lincoln", "George Washington", "John Adams"], answer: "George Washington" },
  { question: "What is the primary color of the Golden Gate Bridge?", options: ["Red", "Orange", "Yellow", "Gold"], answer: "Orange" },
  { question: "Which gas do plants absorb from the atmosphere?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], answer: "Carbon Dioxide" },
  { question: "What is the monetary unit of the United Kingdom?", options: ["Euro", "Pound Sterling", "Dollar", "Franc"], answer: "Pound Sterling" },
  { question: "Which instrument has 88 keys?", options: ["Guitar", "Piano", "Violin", "Flute"], answer: "Piano" },
  { question: "What are the primary colors?", options: ["Red, Blue, Yellow", "Orange, Green, Purple", "Red, White, Blue", "Black, White, Gray"], answer: "Red, Blue, Yellow" },
  { question: "In what year did World War II end?", options: ["1941", "1943", "1945", "1947"], answer: "1945" }
];

const QUESTIONS_PER_GAME = 5;

// Helper to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export default function TriviaScreen() {
  const router = useRouter();
  const [activeQuestions, setActiveQuestions] = useState<typeof QUESTION_POOL>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  const initializeGame = () => {
    // Randomly select 5 questions from the pool
    const shuffledPool = shuffleArray(QUESTION_POOL);
    const selected = shuffledPool.slice(0, QUESTIONS_PER_GAME);
    
    // Optionally, shuffle the options inside those questions too!
    const randomizedOptions = selected.map(q => ({
      ...q,
      options: shuffleArray(q.options)
    }));

    setActiveQuestions(randomizedOptions);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setScore(0);
    setIsGameOver(false);
  };

  useEffect(() => {
    initializeGame();
  }, []);

  const handleOptionSelect = (option: string) => {
    if (selectedOption !== null) return; // Prevent multiple clicks
    setSelectedOption(option);

    if (option === activeQuestions[currentQuestionIndex].answer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < activeQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      setIsGameOver(true);
    }
  };

  if (activeQuestions.length === 0) return null; // Avoid render before init

  const currentQuestion = activeQuestions[currentQuestionIndex];

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
                You scored {score} out of {QUESTIONS_PER_GAME}!
              </Text>
              <TouchableOpacity style={styles.nextButton} onPress={initializeGame}>
                <Text style={styles.nextButtonText}>Play Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                  Question {currentQuestionIndex + 1} of {QUESTIONS_PER_GAME}
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
                    {currentQuestionIndex < activeQuestions.length - 1 ? 'Next Question' : 'See Results'}
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

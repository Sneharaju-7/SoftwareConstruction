import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type Question = {
  question: string;
  options: string[];
  answer: string;
};

const QUESTIONS_DB: Record<string, Question[]> = {
  "General Knowledge": [
    { question: "What is the capital of France?", options: ["Berlin", "London", "Paris", "Madrid"], answer: "Paris" },
    { question: "How many continents are there?", options: ["5", "6", "7", "8"], answer: "7" },
    { question: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], answer: "Pacific" },
    { question: "Which is the longest river in the world?", options: ["Amazon", "Nile", "Yangtze", "Mississippi"], answer: "Nile" },
    { question: "Who painted the Mona Lisa?", options: ["Van Gogh", "Da Vinci", "Picasso", "Michelangelo"], answer: "Da Vinci" },
    { question: "What is the hardest natural substance on Earth?", options: ["Gold", "Iron", "Diamond", "Platinum"], answer: "Diamond" },
    { question: "Which continent is the Sahara Desert located on?", options: ["Asia", "Africa", "South America", "Australia"], answer: "Africa" },
    { question: "What is the smallest country in the world?", options: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"], answer: "Vatican City" },
    { question: "Who wrote 'Hamlet'?", options: ["Charles Dickens", "Leo Tolstoy", "William Shakespeare", "Mark Twain"], answer: "William Shakespeare" },
    { question: "What language has the most native speakers?", options: ["English", "Spanish", "Mandarin Chinese", "Hindi"], answer: "Mandarin Chinese" },
    { question: "What is the currency of Japan?", options: ["Yuan", "Won", "Yen", "Rupee"], answer: "Yen" },
    { question: "Which famous scientist developed the theory of relativity?", options: ["Isaac Newton", "Niels Bohr", "Albert Einstein", "Galileo Galilei"], answer: "Albert Einstein" },
    { question: "Mount Everest is located in which mountain range?", options: ["Alps", "Andes", "Rockies", "Himalayas"], answer: "Himalayas" },
    { question: "What does HTML stand for?", options: ["Hyper Text Markup Language", "High Tech Modern Language", "Hyperlink and Text Markup Language", "Home Tool Markup Language"], answer: "Hyper Text Markup Language" },
    { question: "Who was the first person to step on the Moon?", options: ["Yuri Gagarin", "Buzz Aldrin", "Neil Armstrong", "Michael Collins"], answer: "Neil Armstrong" }
  ],
  "Science & Nature": [
    { question: "Which planet is known as the Red Planet?", options: ["Mars", "Venus", "Jupiter", "Saturn"], answer: "Mars" },
    { question: "What gas do plants absorb from the atmosphere?", options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"], answer: "Carbon Dioxide" },
    { question: "How many bones are in the adult human body?", options: ["206", "208", "210", "214"], answer: "206" },
    { question: "What is the chemical symbol for water?", options: ["H2O", "O2", "CO2", "NaCl"], answer: "H2O" },
    { question: "At what temperature does water boil (in Celsius)?", options: ["50", "90", "100", "120"], answer: "100" },
    { question: "Which animal is the largest mammal in the world?", options: ["Elephant", "Blue Whale", "Giraffe", "Hippopotamus"], answer: "Blue Whale" },
    { question: "What part of the plant conducts photosynthesis?", options: ["Root", "Stem", "Leaf", "Flower"], answer: "Leaf" },
    { question: "What is the most abundant gas in the Earth's atmosphere?", options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"], answer: "Nitrogen" },
    { question: "What force keeps planets in orbit around the sun?", options: ["Magnetism", "Friction", "Gravity", "Electricity"], answer: "Gravity" },
    { question: "Which organ is responsible for pumping blood?", options: ["Brain", "Lungs", "Heart", "Liver"], answer: "Heart" },
    { question: "What is the closest star to Earth?", options: ["Sirius", "Alpha Centauri", "The Sun", "Betelgeuse"], answer: "The Sun" },
    { question: "What phenomenon causes the ocean tides?", options: ["Earth's rotation", "Solar winds", "The Moon's gravitational pull", "Ocean currents"], answer: "The Moon's gravitational pull" },
    { question: "What is the process by which a caterpillar becomes a butterfly?", options: ["Photosynthesis", "Metamorphosis", "Mitosis", "Osmosis"], answer: "Metamorphosis" },
    { question: "Which element has the atomic number 1?", options: ["Helium", "Oxygen", "Carbon", "Hydrogen"], answer: "Hydrogen" },
    { question: "What is the study of weather called?", options: ["Geology", "Meteorology", "Astronomy", "Ecology"], answer: "Meteorology" }
  ],
  "Movies & Entertainment": [
    { question: "Who directed the movie 'Jurassic Park'?", options: ["Steven Spielberg", "James Cameron", "George Lucas", "Christopher Nolan"], answer: "Steven Spielberg" },
    { question: "What is the name of the fictional wizarding school in Harry Potter?", options: ["Hogwarts", "Beauxbatons", "Durmstrang", "Ilvermorny"], answer: "Hogwarts" },
    { question: "Which actor played Forest Gump?", options: ["Brad Pitt", "Tom Hanks", "Leonardo DiCaprio", "Johnny Depp"], answer: "Tom Hanks" },
    { question: "What is the highest-grossing film of all time?", options: ["Avatar", "Avengers: Endgame", "Titanic", "Star Wars"], answer: "Avatar" },
    { question: "In The Lion King, what is the name of Simba's uncle?", options: ["Timon", "Mufasa", "Scar", "Pumbaa"], answer: "Scar" },
    { question: "What is the name of the Hobbit played by Elijah Wood in the Lord of the Rings?", options: ["Samwise Gamgee", "Frodo Baggins", "Bilbo Baggins", "Peregrin Took"], answer: "Frodo Baggins" },
    { question: "Which movie features the quote 'May the Force be with you'?", options: ["Star Trek", "Star Wars", "Dune", "Guardians of the Galaxy"], answer: "Star Wars" },
    { question: "Who played Jack Dawson in Titanic?", options: ["Matt Damon", "Leonardo DiCaprio", "Christian Bale", "Keanu Reeves"], answer: "Leonardo DiCaprio" },
    { question: "What is the name of the main protagonist in The Matrix?", options: ["Morpheus", "Trinity", "Neo", "Smith"], answer: "Neo" },
    { question: "Which animated film features a young lion cub running away from home?", options: ["Tarzan", "Aladdin", "The Lion King", "Brave"], answer: "The Lion King" },
    { question: "What magical item brings Frosty the Snowman to life?", options: ["An old silk hat", "A magical scarf", "A pair of mittens", "A carrot nose"], answer: "An old silk hat" },
    { question: "Who is the villain in the superhero film 'The Dark Knight' (2008)?", options: ["The Riddler", "The Joker", "Bane", "Two-Face"], answer: "The Joker" },
    { question: "What is the name of the fictional African country in Black Panther?", options: ["Genovia", "Zamunda", "Wakanda", "Latveria"], answer: "Wakanda" },
    { question: "What kind of fish is Nemo in 'Finding Nemo'?", options: ["Goldfish", "Clownfish", "Pufferfish", "Angelfish"], answer: "Clownfish" },
    { question: "In which city is 'Ghostbusters' set?", options: ["Los Angeles", "Chicago", "New York City", "Boston"], answer: "New York City" }
  ]
};

export default function TriviaScreen() {
  const router = useRouter();
  const [category, setCategory] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  const startGame = (selectedCategory: string) => {
    setCategory(selectedCategory);
    
    // Select 5 random questions
    const categoryQuestions = [...QUESTIONS_DB[selectedCategory]].sort(() => Math.random() - 0.5);
    const selectedQ = categoryQuestions.slice(0, 5);
    
    setQuestions(selectedQ);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setScore(0);
    setIsGameOver(false);
  };

  const handleOptionSelect = (option: string) => {
    if (selectedOption !== null) return; // Prevent multiple clicks
    setSelectedOption(option);

    if (option === questions[currentQuestionIndex].answer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      setIsGameOver(true);
    }
  };

  const restartGame = () => {
    setCategory(null);
  };

  if (!category) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={28} color="#1E293B" />
            </TouchableOpacity>
          </View>
          <Text style={styles.heroTitle}>Fun Trivia</Text>
          <Text style={styles.heroSubheadline}>Choose a category to begin!</Text>

          <View style={styles.categoryContainer}>
            {Object.keys(QUESTIONS_DB).map((cat) => (
              <TouchableOpacity key={cat} style={styles.categoryButton} onPress={() => startGame(cat)}>
                <Text style={styles.categoryButtonText}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#1E293B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.changeConfigButton} onPress={restartGame}>
            <Text style={styles.changeConfigText}>Change Category</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.heroTitle}>{category}</Text>
        <Text style={styles.heroSubheadline}>Test your knowledge!</Text>

        <View style={styles.gameBoard}>
          {isGameOver ? (
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreTitle}>Game Over!</Text>
              <Text style={styles.scoreText}>
                You scored {score} out of {questions.length}!
              </Text>
              <TouchableOpacity style={styles.nextButton} onPress={restartGame}>
                <Text style={styles.nextButtonText}>Play Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                  Question {currentQuestionIndex + 1} of {questions.length}
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
                    {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  backButton: { padding: 8 },
  changeConfigButton: { padding: 8 },
  changeConfigText: { color: '#059669', fontSize: 16, fontWeight: '700' },
  heroTitle: { fontSize: 40, fontWeight: '900', color: '#1E293B', marginBottom: 8 },
  heroSubheadline: { fontSize: 20, color: '#475569', marginBottom: 30 },
  categoryContainer: { gap: 16 },
  categoryButton: { backgroundColor: '#F8FAFC', padding: 24, borderRadius: 20, borderWidth: 2, borderColor: '#E2E8F0', alignItems: 'center' },
  categoryButtonText: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
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

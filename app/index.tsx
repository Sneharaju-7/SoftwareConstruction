import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function LandingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isWeb = Platform.OS === 'web';
  const isLargeScreen = width >= 768;

  const navigateToMockup = () => {
    router.push('/login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.contentWrapper}>
          
          {/* Navigation Bar */}
          <View style={styles.navBar}>
            <View style={styles.logoContainer}>
              <Ionicons name="leaf" size={32} color="#1E293B" />
              <Text style={styles.logoText}>GreyGo</Text>
            </View>
            <View style={styles.navButtons}>
              <TouchableOpacity style={styles.navButtonSecondary} onPress={() => router.push('/signup')}>
                <Text style={styles.navButtonSecondaryText}>Sign Up</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navButtonPrimary} onPress={navigateToMockup}>
                <Text style={styles.navButtonPrimaryText}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>Welcome to GreyGo</Text>
            <Text style={styles.heroSubheadline}>Your calm, happy companion.</Text>
          </View>

          {/* Features Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Why GreyGo?</Text>
            <View style={[styles.featuresContainer, isLargeScreen && styles.featuresContainerWeb]}>
              <View style={styles.featureCard}>
                <Ionicons name="notifications" size={36} color="#D97706" style={styles.featureIcon} />
                <Text style={styles.featureCardTitle}>Gentle Reminders</Text>
                <Text style={styles.featureCardText}>Stay on top of medications and appointments without feeling overwhelmed.</Text>
              </View>
              <View style={styles.featureCard}>
                <Ionicons name="people" size={36} color="#059669" style={styles.featureIcon} />
                <Text style={styles.featureCardTitle}>Stay Connected</Text>
                <Text style={styles.featureCardText}>Easily reach out to your family members and emergency contacts.</Text>
              </View>
              <View style={styles.featureCard}>
                <Ionicons name="game-controller" size={36} color="#7C3AED" style={styles.featureIcon} />
                <Text style={styles.featureCardTitle}>Daily Fun</Text>
                <Text style={styles.featureCardText}>Keep your mind sharp with puzzles and daily mental exercises.</Text>
              </View>
            </View>
          </View>

          {/* Testimonials Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What our fellow GreyGo'ers say</Text>
            <View style={[styles.testimonialsContainer, isLargeScreen && styles.testimonialsContainerWeb]}>
              <View style={styles.testimonialCard}>
                <Text style={styles.testimonialQuote}>"GreyGo has been a blessing. I never miss my pills, and the word games keep me entertained!"</Text>
                <Text style={styles.testimonialAuthor}>- Margaret, 78</Text>
              </View>
              <View style={styles.testimonialCard}>
                <Text style={styles.testimonialQuote}>"I love how big and readable everything is. I can connect with my son in just one tap."</Text>
                <Text style={styles.testimonialAuthor}>- Robert, 82</Text>
              </View>
              <View style={styles.testimonialCard}>
                <Text style={styles.testimonialQuote}>"The 'I'm feeling low' button really helps when I just need someone to talk to."</Text>
                <Text style={styles.testimonialAuthor}>- Susan, 75</Text>
              </View>
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  contentWrapper: {
    padding: 24,
    maxWidth: 1024,
    width: '100%',
    alignSelf: 'center',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 60,
    marginTop: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B', // Dark Navy
    marginLeft: 8,
  },
  navButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButtonSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginRight: 16,
    borderRadius: 30,
  },
  navButtonSecondaryText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  navButtonPrimary: {
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
  },
  navButtonPrimaryText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 80,
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
    color: '#475569', // Softer Navy/Gray
    textAlign: 'center',
  },
  section: {
    marginBottom: 80,
  },
  sectionTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 40,
  },
  featuresContainer: {
    flexDirection: 'column',
    gap: 24,
  },
  featuresContainerWeb: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  featureCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    padding: 32,
    flex: 1,
    minWidth: 280,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  featureIcon: {
    marginBottom: 16,
  },
  featureCardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  featureCardText: {
    fontSize: 18,
    color: '#475569',
    lineHeight: 28,
  },
  testimonialsContainer: {
    flexDirection: 'column',
    gap: 24,
  },
  testimonialsContainerWeb: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  testimonialCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 24,
    padding: 32,
    flex: 1,
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  testimonialQuote: {
    fontSize: 20,
    fontStyle: 'italic',
    color: '#1E293B',
    lineHeight: 30,
    marginBottom: 20,
  },
  testimonialAuthor: {
    fontSize: 18,
    fontWeight: '700',
    color: '#92400E',
    textAlign: 'right',
  },
});

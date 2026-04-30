import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { saveUserProfile } from '../utils/storage';
import { loginBackendUser } from '../utils/backendApi';

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !phone) {
      setErrorMessage('Please enter both your username and phone number.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    const backendResult = await loginBackendUser({ username, phone });
    if (!backendResult.ok) {
      setIsLoading(false);
      setErrorMessage(backendResult.error || 'Login failed.');
      return;
    }

    await saveUserProfile({
      name: backendResult.data?.username || username,
      phone: backendResult.data?.phoneNumber || phone,
      photoUri: backendResult.data?.profilePicture || '',
    });

    setIsLoading(false);
    router.push('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.contentWrapper}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={28} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Login</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.infoText}>Welcome back! Please enter your details.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. kritika"
                placeholderTextColor="#94A3B8"
                value={username}
                onChangeText={setUsername}
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 9876543210"
                placeholderTextColor="#94A3B8"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={isLoading}>
              <Text style={styles.primaryButtonText}>{isLoading ? 'Logging in...' : 'Login'}</Text>
            </TouchableOpacity>
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
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
    marginTop: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
  },
  headerSpacer: {
    width: 28,
  },
  formContainer: {
    width: '100%',
  },
  infoText: {
    fontSize: 22,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 40,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    padding: 20,
    fontSize: 20,
    color: '#1E293B',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#1E293B',
    paddingVertical: 20,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

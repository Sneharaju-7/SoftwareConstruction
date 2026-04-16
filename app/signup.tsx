import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, useWindowDimensions, ScrollView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function SignUpScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  
  // Step 1 indicates details form, Step 2 indicates OTP verification
  const [step, setStep] = useState(1);
  
  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };
  
  // App State
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isWeb = Platform.OS === 'web';

  const handleSendOTP = () => {
    if (!name || !phone || !profileImage) {
      setErrorMessage('Please enter your name, phone, and upload a profile picture.');
      return;
    }
    setErrorMessage('');
    setIsLoading(true);
    
    // Mock API call to send OTP
    setTimeout(() => {
      setIsLoading(false);
      setStep(2);
      // Simulating receiving an SMS OTP of '1234'
    }, 1000);
  };

  const handleVerifyOTP = () => {
    if (!otp) {
      setErrorMessage('Please enter the OTP.');
      return;
    }
    
    setErrorMessage('');
    setIsLoading(true);
    
    // Mock API verification
    setTimeout(() => {
      setIsLoading(false);
      if (otp === '1234') {
        // Success
        router.push('/(tabs)');
      } else {
        // Failure
        setErrorMessage('Invalid OTP, try again.');
      }
    }, 1000);
  };

  const navigateBack = () => {
    if (step === 2) {
      setStep(1);
      setErrorMessage('');
      setOtp('');
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.contentWrapper}>
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={28} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Sign Up</Text>
            <View style={{ width: 28 }} /> {/* Spacer */}
          </View>

          {step === 1 ? (
            <View style={styles.formContainer}>
              <Text style={styles.infoText}>Let's set up your profile.</Text>

              {/* Photo Upload Placeholder */}
              <TouchableOpacity style={styles.photoUploadContainer} onPress={pickImage}>
                <View style={[styles.photoUploadCircle, profileImage ? styles.photoUploadCircleWithImage : null]}>
                  {profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.profileImage} />
                  ) : (
                    <Ionicons name="camera" size={48} color="#94A3B8" />
                  )}
                </View>
                <Text style={styles.photoUploadText}>{profileImage ? 'Change photo' : 'Tap to add photo'}</Text>
              </TouchableOpacity>

              {/* Input Fields */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Your Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. John Doe"
                  placeholderTextColor="#94A3B8"
                  value={name}
                  onChangeText={setName}
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 555-123-4567"
                  placeholderTextColor="#94A3B8"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>

              {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

              <TouchableOpacity style={styles.primaryButton} onPress={handleSendOTP} disabled={isLoading}>
                <Text style={styles.primaryButtonText}>{isLoading ? 'Sending...' : 'Send OTP'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formContainer}>
              <Text style={styles.infoText}>We sent a code to {phone}</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Enter 4-digit code</Text>
                <TextInput
                  style={[styles.textInput, styles.otpInput]}
                  placeholder="0000"
                  placeholderTextColor="#94A3B8"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>

              {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

              <TouchableOpacity style={styles.primaryButton} onPress={handleVerifyOTP} disabled={isLoading}>
                <Text style={styles.primaryButtonText}>{isLoading ? 'Verifying...' : 'Verify OTP'}</Text>
              </TouchableOpacity>
              
              <Text style={styles.hintText}>(Hint: Use '1234')</Text>
            </View>
          )}

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
  formContainer: {
    width: '100%',
  },
  infoText: {
    fontSize: 22,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 32,
  },
  photoUploadContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  photoUploadCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  photoUploadCircleWithImage: {
    borderStyle: 'solid',
    borderColor: '#1E293B',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  photoUploadText: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '500',
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
  otpInput: {
    textAlign: 'center',
    fontSize: 32,
    letterSpacing: 20,
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
  hintText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#94A3B8',
  },
});

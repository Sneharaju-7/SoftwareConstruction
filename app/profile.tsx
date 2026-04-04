import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getUserProfile, saveUserProfile } from '../utils/storage';

export default function ProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUri, setPhotoUri] = useState('');

  useEffect(() => {
    getUserProfile().then(profile => {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setPhotoUri(profile.photoUri || '');
    });
  }, []);

  const handleSave = async () => {
    await saveUserProfile({ name, phone, photoUri });
    router.back();
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("Camera permissions are required to take a photo!");
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={32} color="#1E293B" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
            {photoUri ? (
               <Image source={{ uri: photoUri }} style={styles.avatarImage} />
            ) : (
               <Ionicons name="person-circle" size={120} color="#CBD5E1" />
            )}
          </TouchableOpacity>
          
          <View style={styles.photoActionsRow}>
            <TouchableOpacity style={styles.photoActionButton} onPress={pickImage}>
              <Ionicons name="images" size={20} color="#1E293B" style={{marginRight: 8}} />
              <Text style={styles.photoActionText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoActionButton} onPress={takePhoto}>
              <Ionicons name="camera" size={20} color="#1E293B" style={{marginRight: 8}} />
              <Text style={styles.photoActionText}>Camera</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.title}>Edit Profile</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your Name</Text>
            <TextInput style={styles.input} placeholder="John Doe" placeholderTextColor="#94A3B8" value={name} onChangeText={setName} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput style={styles.input} placeholder="555-123-4567" placeholderTextColor="#94A3B8" value={phone} keyboardType="phone-pad" onChangeText={setPhone} />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { padding: 24, alignSelf: 'center', width: '100%', maxWidth: 600 },
  headerRow: { alignItems: 'flex-end', marginBottom: 20 },
  backButton: { padding: 8 },
  content: { alignItems: 'center' },
  avatarContainer: { marginBottom: 12, width: 120, height: 120, borderRadius: 60, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  avatarImage: { width: 120, height: 120, borderRadius: 60 },
  photoActionsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  photoActionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  photoActionText: { color: '#1E293B', fontWeight: '600' },
  title: { fontSize: 32, fontWeight: '800', color: '#1E293B', marginBottom: 40 },
  inputGroup: { width: '100%', marginBottom: 24 },
  label: { fontSize: 20, color: '#1E293B', fontWeight: '600', marginBottom: 12 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 16, padding: 20, fontSize: 20, color: '#1E293B' },
  saveButton: { backgroundColor: '#1E293B', width: '100%', padding: 20, borderRadius: 30, alignItems: 'center', marginTop: 20 },
  saveButtonText: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
});

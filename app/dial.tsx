import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function DialScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleCall = async () => {
    const cleanedNumber = phoneNumber.replace(/[^0-9+]/g, '');

    if (!cleanedNumber) {
      Alert.alert('Invalid Number', 'Please enter a valid phone number.');
      return;
    }

    if (Platform.OS === 'web') {
      try {
        await Linking.openURL(`tel:${cleanedNumber}`);
      } catch {
        Alert.alert('Cannot Open Dialer', 'This browser could not open a dialing app.');
      }
      return;
    }

    const dialUrl = `tel:${cleanedNumber}`;
    const canDial = await Linking.canOpenURL(dialUrl);

    if (!canDial) {
      Alert.alert('Cannot Place Call', 'This device cannot open the phone dialer.');
      return;
    }

    await Linking.openURL(dialUrl);
  };

  const addDigit = (digit: string) => {
    setPhoneNumber(prev => prev + digit);
  };

  const deleteDigit = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  const keypad = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#']
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#1E293B" />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Manual Dial</Text>

        <View style={styles.display}>
          <Text style={styles.phoneNumber}>{phoneNumber || 'Enter number'}</Text>
        </View>

        <View style={styles.keypad}>
          {keypad.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map(digit => (
                <TouchableOpacity key={digit} style={styles.key} onPress={() => addDigit(digit)}>
                  <Text style={styles.keyText}>{digit}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.deleteButton} onPress={deleteDigit}>
            <Ionicons name="backspace" size={24} color="#1E293B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.callButton} onPress={handleCall}>
            <Ionicons name="call" size={24} color="#059669" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, padding: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButton: { padding: 8 },
  title: { fontSize: 32, fontWeight: '900', color: '#1E293B', textAlign: 'center', marginBottom: 40 },
  display: { backgroundColor: '#F8FAFC', borderRadius: 20, padding: 20, marginBottom: 40, alignItems: 'center' },
  phoneNumber: { fontSize: 24, color: '#1E293B', fontWeight: '600' },
  keypad: { flex: 1, justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  key: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  keyText: { fontSize: 24, color: '#1E293B', fontWeight: '600' },
  actions: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginTop: 40 },
  deleteButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  callButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#059669', justifyContent: 'center', alignItems: 'center' },
});

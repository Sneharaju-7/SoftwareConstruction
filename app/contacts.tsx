import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Linking, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getContacts, saveContacts, Contact } from '../utils/storage';

export default function ContactsScreen() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getContacts().then(setContacts);
  }, []);

  const handleAdd = async () => {
    if (!name || !phone || !relation) {
      setError('Please fill in Name, Phone, and Relation.');
      return;
    }
    if (contacts.length >= 5) {
      setError('You can only add up to 5 emergency contacts.');
      return;
    }
    setError('');
    
    const newContact: Contact = { id: Date.now().toString(), name, phone, relation };
    const updated = [...contacts, newContact];
    setContacts(updated);
    await saveContacts(updated);
    
    // Reset form
    setName('');
    setPhone('');
    setRelation('');
  };

  const handleDelete = async (id: string) => {
    const updated = contacts.filter(c => c.id !== id);
    setContacts(updated);
    await saveContacts(updated);
  };

  const handleCall = async (phoneNumber: string) => {
    const cleanedNumber = phoneNumber.replace(/[^0-9+]/g, '');
    const callUrl = `tel:${cleanedNumber}`;

    if (!cleanedNumber) {
      Alert.alert('Invalid Number', 'Please update this contact with a valid phone number.');
      return;
    }

    if (Platform.OS === 'web') {
      try {
        await Linking.openURL(callUrl);
      } catch {
        Alert.alert('Cannot Open Dialer', 'This browser could not open a dialing app.');
      }
      return;
    }

    const supported = await Linking.canOpenURL(callUrl);
    if (!supported) {
      Alert.alert('Cannot Place Call', 'Calling is not supported on this device.');
      return;
    }

    await Linking.openURL(callUrl);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.title}>Emergency Contacts</Text>
          <View style={{ width: 28 }} />
        </View>

        <Text style={styles.subtitle}>Add up to 5 Emergency Contacts so we can reach them if needed.</Text>

        <View style={styles.formContainer}>
          <TextInput style={styles.input} placeholder="Contact Name" placeholderTextColor="#94A3B8" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor="#94A3B8" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <TextInput style={styles.input} placeholder="Relation (e.g. Son, Friend)" placeholderTextColor="#94A3B8" value={relation} onChangeText={setRelation} />
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.addButton} onPress={handleAdd} disabled={contacts.length >= 5}>
            <Text style={styles.addButtonText}>+ Add Contact ({contacts.length}/5)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          {contacts.length === 0 ? (
            <Text style={styles.emptyText}>No contacts added yet.</Text>
          ) : (
            contacts.map((contact) => (
              <View key={contact.id} style={styles.contactCard}>
                <View>
                  <Text style={styles.contactName}>{contact.name} <Text style={styles.contactRelation}>({contact.relation})</Text></Text>
                  <Text style={styles.contactPhone}>{contact.phone}</Text>
                </View>
                <View style={styles.contactActions}>
                  <TouchableOpacity style={styles.callButton} onPress={() => handleCall(contact.phone)}>
                    <Ionicons name="call-outline" size={22} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(contact.id)}>
                    <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { padding: 24, maxWidth: 600, width: '100%', alignSelf: 'center', paddingBottom: 60 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backButton: { padding: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#1E293B' },
  subtitle: { fontSize: 18, color: '#475569', marginBottom: 30, textAlign: 'center' },
  formContainer: { backgroundColor: '#F8FAFC', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 40 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', padding: 16, borderRadius: 16, fontSize: 18, marginBottom: 16, color: '#1E293B' },
  addButton: { backgroundColor: '#1E293B', padding: 18, borderRadius: 24, alignItems: 'center' },
  addButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  errorText: { color: '#EF4444', marginBottom: 16, textAlign: 'center', fontWeight: 'bold' },
  listContainer: { width: '100%' },
  emptyText: { textAlign: 'center', fontSize: 18, color: '#94A3B8', marginTop: 20 },
  contactCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  contactName: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  contactRelation: { fontSize: 18, fontWeight: 'normal', color: '#64748B' },
  contactPhone: { fontSize: 18, color: '#475569', marginTop: 4 },
  contactActions: { flexDirection: 'row', alignItems: 'center' },
  callButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  deleteButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

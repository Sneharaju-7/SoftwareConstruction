import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function CheckinScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [feelingSelected, setFeelingSelected] = useState(false);

  const emojis = [
    { label: 'Happy', icon: '😄', initReply: "That's wonderful! What made you happy today?" },
    { label: 'Okay', icon: '🙂', initReply: "Glad to hear you are doing okay! Did anything interesting happen?" },
    { label: 'Neutral', icon: '😐', initReply: "I see. Something on your mind?" },
    { label: 'Sad', icon: '😢', initReply: "I'm sorry you are feeling sad. Would you like to talk about it?" },
    { label: 'Angry', icon: '😡', initReply: "It's completely normal to feel upset. Has something happened?" },
  ];

  const handleEmojiSelect = (emoji: typeof emojis[0]) => {
    setFeelingSelected(true);
    setMessages([
      { role: 'user', content: emoji.icon },
      { role: 'assistant', content: emoji.initReply }
    ]);
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    const newMsg: Message = { role: 'user', content: inputText };
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setInputText('');
    setLoading(true);

    try {
      // Connect to Grok /xAI API
      const apiKey = process.env.EXPO_PUBLIC_GROK_API_KEY || 'PLACEHOLDER';
      
      if (apiKey === 'PLACEHOLDER') {
          // Fallback mockup
          setTimeout(() => {
              setMessages([...updatedMessages, { role: 'assistant', content: "That's very interesting. Tell me more about it!" }]);
              setLoading(false);
          }, 1000);
          return;
      }

      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are a warm, kind, and patient elderly companion chat bot. Keep your responses short, supportive, and engaging.' },
            ...updatedMessages
          ],
          model: 'grok-beta',
          stream: false,
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      const reply = data.choices[0].message.content;
      setMessages([...updatedMessages, { role: 'assistant', content: reply }]);
      
    } catch (e) {
      console.error(e);
      setMessages([...updatedMessages, { role: 'assistant', content: "I'm having trouble connecting right now, but I am still here tracking your check-in." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.heroTitle}>Daily Check-in</Text>
          <View style={{ width: 28 }} />
        </View>

        {!feelingSelected ? (
          <View style={styles.selectionView}>
            <Text style={styles.heroSubheadline}>How are you feeling today?</Text>
            <View style={styles.emojiGrid}>
              {emojis.map((emoji) => (
                <TouchableOpacity key={emoji.label} style={styles.emojiCard} onPress={() => handleEmojiSelect(emoji)}>
                  <Text style={styles.emojiIcon}>{emoji.icon}</Text>
                  <Text style={styles.emojiLabel}>{emoji.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.chatView}>
            <ScrollView style={styles.messagesContainer} contentContainerStyle={{ padding: 16 }}>
              {messages.map((msg, idx) => (
                <View key={idx} style={[styles.messageBubble, msg.role === 'user' ? styles.userBubble : styles.botBubble]}>
                  <Text style={[styles.messageText, msg.role === 'user' ? styles.userText : styles.botText]}>
                    {msg.content}
                  </Text>
                </View>
              ))}
              {loading && (
                <View style={[styles.messageBubble, styles.botBubble]}>
                  <Text style={styles.botText}>Typing...</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.inputArea}>
              <TextInput style={styles.input} placeholder="Type a message..." placeholderTextColor="#94A3B8" value={inputText} onChangeText={setInputText} />
              <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={loading}>
                <Ionicons name="send" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20 },
  backButton: { padding: 8 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
  heroSubheadline: { fontSize: 28, color: '#1E293B', fontWeight: '800', textAlign: 'center', marginBottom: 40 },
  selectionView: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 },
  emojiCard: { alignItems: 'center', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 24, borderWidth: 1, borderColor: '#E2E8F0', width: 120, height: 120, justifyContent: 'center' },
  emojiIcon: { fontSize: 48, marginBottom: 8 },
  emojiLabel: { fontSize: 16, fontWeight: '700', color: '#475569' },
  chatView: { flex: 1, backgroundColor: '#F8FAFC' },
  messagesContainer: { flex: 1 },
  messageBubble: { maxWidth: '80%', padding: 16, borderRadius: 20, marginBottom: 12 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#1E293B', borderBottomRightRadius: 4 },
  botBubble: { alignSelf: 'flex-start', backgroundColor: '#E2E8F0', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 18, lineHeight: 26 },
  userText: { color: '#FFFFFF' },
  botText: { color: '#1E293B' },
  inputArea: { flexDirection: 'row', padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 24, paddingVertical: 14, paddingHorizontal: 20, fontSize: 18, color: '#1E293B', marginRight: 12 },
  sendButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' },
});

import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const INITIAL_OPTIONS = [
  { label: "I'm physically hurt.", icon: "🤕" },
  { label: "I want to talk.", icon: "💬" },
  { label: "I need to rest.", icon: "🛌" },
];

export default function CheckinScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [feelingSelected, setFeelingSelected] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [currentOptions, setCurrentOptions] = useState<{label: string, icon: string}[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  const emojis = [
    { label: 'Happy', icon: '😄', initReply: "That's wonderful! What made you happy today? How is your physical health holding up?" },
    { label: 'Okay', icon: '🙂', initReply: "Glad to hear you are doing okay! Do you have any physical aches or tiredness?" },
    { label: 'Neutral', icon: '😐', initReply: "I see. Something on your mind? How was your sleep?" },
    { label: 'Sad', icon: '😢', initReply: "I'm sorry you are feeling sad. Mental health is just as important as physical health. Want to talk about it?" },
    { label: 'Angry', icon: '😡', initReply: "It's completely normal to feel upset. Has something happened? Be sure to take deep breaths." },
  ];

  const handleEmojiSelect = (emoji: typeof emojis[0]) => {
    setFeelingSelected(true);
    setCurrentOptions(INITIAL_OPTIONS);
    setMessages([
      { role: 'system', content: `You are GreyGo, a compassionate health and AI companion for older adults. You use simple language, are very encouraging, and listen carefully. Keep responses short (under 3 sentences), supportive, and directly address physical aches, sleep, and emotional moods.

You must ALWAYS respond in valid JSON format with exactly two properties:
1. "reply": A string containing your spoken response to the user.
2. "options": An array of exactly 3 or 4 suggested follow-up options for the user. Each option should be an object with "label" (string) and "icon" (a single emoji string).

Example response:
{
  "reply": "I'm glad you're feeling okay today. Did you sleep well last night?",
  "options": [
    { "label": "Yes, I slept great!", "icon": "😴" },
    { "label": "Not really, waking up a lot.", "icon": "🥱" },
    { "label": "I want to talk about something else.", "icon": "💬" }
  ]
}` },
      { role: 'user', content: emoji.icon },
      { role: 'assistant', content: emoji.initReply }
    ]);
  };

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || inputText.trim();
    if (!textToSend) return;
    
    const newMsg: Message = { role: 'user', content: textToSend };
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setInputText('');
    setShowTextInput(false);
    setLoading(true);

    try {
      const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
      
      if (!apiKey) {
        setMessages([...updatedMessages, { role: 'assistant', content: "Error: EXPO_PUBLIC_GROQ_API_KEY is missing from your .env file." }]);
        setLoading(false);
        return;
      }

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          messages: updatedMessages,
          model: 'llama-3.1-8b-instant',
          response_format: { type: "json_object" },
          stream: false,
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'API request failed');
      }

      const assistantMessageRaw = data.choices[0].message.content;
      let replyText = "";
      try {
        const parsed = JSON.parse(assistantMessageRaw);
        replyText = parsed.reply || "I'm here for you.";
        if (parsed.options && Array.isArray(parsed.options)) {
          setCurrentOptions(parsed.options);
        }
      } catch(e) {
         replyText = assistantMessageRaw;
      }
      
      setMessages((prev) => [...prev, { role: 'assistant', content: replyText }]);
      
    } catch (e: any) {
      console.error(e);
      setMessages((prev) => [...prev, { role: 'assistant', content: `Sorry, I'm having trouble connecting right now. (${e.message})` }]);
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
            <ScrollView 
              style={styles.messagesContainer} 
              contentContainerStyle={{ padding: 16 }}
              ref={scrollViewRef}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.filter(m => m.role !== 'system').map((msg, idx) => (
                <View key={idx} style={[styles.messageBubble, msg.role === 'user' ? styles.userBubble : styles.botBubble]}>
                  <Text style={[styles.messageText, msg.role === 'user' ? styles.userText : styles.botText]}>
                    {msg.content}
                  </Text>
                </View>
              ))}
              {loading && (
                <View style={styles.loadingContainer}>
                   <ActivityIndicator size="small" color="#475569" />
                   <Text style={styles.loadingText}>Analyzing health info...</Text>
                </View>
              )}
            </ScrollView>

            {!loading && !showTextInput && (
               <View style={styles.optionsWrapper}>
                 <Text style={styles.optionsPrompt}>Select an option below to reply:</Text>
                 <View style={styles.optionsList}>
                   {currentOptions.map((opt, index) => (
                     <TouchableOpacity 
                       key={index} 
                       style={styles.presetButton} 
                       onPress={() => handleSend(opt.label)}
                     >
                       <Text style={styles.presetButtonText}>{opt.icon}  {opt.label}</Text>
                     </TouchableOpacity>
                   ))}
                   <TouchableOpacity 
                     style={[styles.presetButton, styles.customOptionButton]} 
                     onPress={() => setShowTextInput(true)}
                   >
                     <Text style={styles.customOptionButtonText}>Something else...</Text>
                     <Ionicons name="pencil" size={18} color="#1E293B" style={{ marginLeft: 6 }} />
                   </TouchableOpacity>
                 </View>
               </View>
            )}

            {showTextInput && (
              <View style={styles.inputArea}>
                <TouchableOpacity style={styles.closeInputBtn} onPress={() => setShowTextInput(false)}>
                  <Ionicons name="close-circle" size={28} color="#64748B" />
                </TouchableOpacity>
                <TextInput 
                  style={styles.input} 
                  placeholder="Type a message..." 
                  placeholderTextColor="#94A3B8" 
                  value={inputText} 
                  onChangeText={setInputText} 
                  autoFocus
                  multiline
                />
                <TouchableOpacity style={styles.sendButton} onPress={() => handleSend()} disabled={loading || !inputText.trim()}>
                  <Ionicons name="send" size={24} color={loading || !inputText.trim() ? "#CBD5E1" : "#FFFFFF"} />
                </TouchableOpacity>
              </View>
            )}
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
  loadingContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginLeft: 8 },
  loadingText: { marginLeft: 8, color: '#64748B', fontSize: 14, fontStyle: 'italic' },
  
  optionsWrapper: { padding: 16, borderTopWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  optionsPrompt: { fontSize: 16, fontWeight: '600', color: '#475569', marginBottom: 12, textAlign: 'center' },
  optionsList: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  presetButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 20, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  presetButtonText: { fontSize: 16, color: '#334155', fontWeight: '500' },
  customOptionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E2E8F0', borderColor: '#94A3B8' },
  customOptionButtonText: { fontSize: 16, color: '#1E293B', fontWeight: '600' },
  
  inputArea: { flexDirection: 'row', padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  closeInputBtn: { marginRight: 8 },
  input: { flex: 1, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 24, paddingVertical: 14, paddingHorizontal: 20, fontSize: 18, color: '#1E293B', marginRight: 12, maxHeight: 100 },
  sendButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' },
});

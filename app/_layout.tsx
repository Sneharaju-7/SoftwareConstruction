import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        
        {/* Core Features */}
        <Stack.Screen name="profile" options={{ presentation: 'modal', title: 'Edit Profile' }} />
        <Stack.Screen name="alerts" options={{ title: 'My Alerts' }} />
        <Stack.Screen name="checkin" options={{ title: 'Daily Check-in' }} />
        <Stack.Screen name="contacts" options={{ title: 'Emergency Contacts' }} />
        <Stack.Screen name="feeling-low" options={{ title: "I'm Feeling Low" }} />
        <Stack.Screen name="sos" options={{ title: 'SOS Dashboard' }} />
        <Stack.Screen name="games/index" options={{ title: 'Games Hub' }} />
        <Stack.Screen name="groq-chat" options={{ title: 'AI Companion' }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

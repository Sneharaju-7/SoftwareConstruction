import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
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
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

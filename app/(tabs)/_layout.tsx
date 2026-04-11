import { Tabs } from 'expo-router';
import React from 'react';
<<<<<<< HEAD
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
=======
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
>>>>>>> d742ba1 (Merge AI Companion into Daily Check-in with dynamic choices)

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
<<<<<<< HEAD
        tabBarActiveTintColor: '#2f95dc',
=======
        tabBarActiveTintColor: colorScheme === 'dark' ? '#fff' : '#000',
>>>>>>> d742ba1 (Merge AI Companion into Daily Check-in with dynamic choices)
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="home" color={color} />,
        }}
      />
    </Tabs>
  );
}

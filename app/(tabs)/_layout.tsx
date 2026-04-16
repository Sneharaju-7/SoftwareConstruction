import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const activeTint = colorScheme === 'dark' ? '#FFFFFF' : '#1E293B';
  const inactiveTint = '#64748B';

  return (
    <Tabs
      screenOptions={{
<<<<<<< HEAD
        tabBarActiveTintColor: activeTint,
        tabBarInactiveTintColor: inactiveTint,
=======
        tabBarActiveTintColor: colorScheme === 'dark' ? '#fff' : '#000',
>>>>>>> 9a9460bb2dc20ae3f4165766183cbdefcded6dc8
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
<<<<<<< HEAD
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
=======
          tabBarIcon: ({ color }) => <Ionicons size={28} name="home" color={color} />,
>>>>>>> 9a9460bb2dc20ae3f4165766183cbdefcded6dc8
        }}
      />
    </Tabs>
  );
}

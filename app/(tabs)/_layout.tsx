import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint || '#007AFF',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarStyle: { paddingBottom: 8, paddingTop: 8, height: 60 },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Courses',
          tabBarIcon: ({ color }) => <MaterialIcons name="school" size={28} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'My Learning',
          tabBarIcon: ({ color }) => <MaterialIcons name="play-circle-outline" size={28} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="bookmarks"
        options={{
          title: 'Bookmarks',
          tabBarIcon: ({ color }) => <MaterialIcons name="bookmark" size={28} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <MaterialIcons name="person" size={28} color={color} />,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}

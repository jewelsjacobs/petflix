import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/themes';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primaryPurple,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          // Add any specific styles for the tab bar if needed
        },
      }}
    >
      <Tabs.Screen
        name="index" // This corresponds to app/(tabs)/index.tsx
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="creations" // This corresponds to app/(tabs)/creations.tsx
        options={{
          title: 'Creations',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="video-library" size={size} color={color} />
          ),
        }}
      />
      {/* Add other tabs here if needed */}
    </Tabs>
  );
} 
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: Colors.dark.background, // Match the dark theme
          borderTopColor: Colors.dark.background, // No top border
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Swipe',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="film.stack" color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="magnifyingglass" color={color} />,
        }}
      />
      <Tabs.Screen
        name="watchlist" // This will be a new screen
        options={{
          title: 'Watchlist',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.and.film" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
        <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gearshape.fill" color={color} />,
        }}
      />

      {/* Hide unwanted tabs by setting href to null */}
      <Tabs.Screen name="ai" options={{ href: null }} />
      <Tabs.Screen name="following" options={{ href: null }} />
      <Tabs.Screen name="list" options={{ href: null }} />
      <Tabs.Screen name="movies" options={{ href: null }} />
    </Tabs>
  );
}

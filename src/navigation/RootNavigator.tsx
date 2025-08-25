// src/navigation/RootNavigator.tsx
import React, { useMemo } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../theme';
import { useSettings } from '../hooks/useSettings';

// Tab screens
import HomeScreen from '../screens/HomeScreen';
import DatabaseScreen from '../screens/DatabaseScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Pushed screens
import VerifyScreen from '../screens/VerifyScreen';
import ScanScreen from '../screens/ScanScreen';

// ---- Param lists (optional) ----
export type TabsParamList = {
  Home: undefined;
  Database: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Root: undefined;
  Verify: { query?: string } | undefined;
  Scan: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabsParamList>();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.text,
        tabBarInactiveTintColor: theme.colors.hint,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let icon: keyof typeof Ionicons.glyphMap = 'home-outline';
          if (route.name === 'Home') icon = focused ? 'home' : 'home-outline';
          if (route.name === 'Database') icon = focused ? 'albums' : 'albums-outline';
          if (route.name === 'Settings') icon = focused ? 'settings' : 'settings-outline';
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Database" component={DatabaseScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { settings } = useSettings();

  // Build nav theme from DefaultTheme (keeps required fields like 'fonts')
  const navTheme = useMemo(() => {
    const isDark = settings.theme === 'dark';
    return {
      ...DefaultTheme,
      dark: isDark,
      colors: {
        ...DefaultTheme.colors,
        background: isDark ? '#0B0F1A' : '#FFFFFF',
        card:       isDark ? '#0E1422' : '#F8FAFC',
        text:       isDark ? '#E6EAF2' : '#0B1220',
        border:     isDark ? '#1E293B' : '#D0D7E2',
        primary:    theme.colors.primary,
        notification: '#ff453a',
      },
    };
  }, [settings.theme]);

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.bg },
          headerTintColor: theme.colors.text,
          headerTitleStyle: { color: theme.colors.text },
          headerShadowVisible: false,
        }}
      >
        {/* Tabs host */}
        <Stack.Screen
          name="Root"
          component={Tabs}
          options={{ headerShown: false, title: 'Scamicide' }}
        />

        {/* Pushed screens with explicit iOS back label */}
        <Stack.Screen
          name="Verify"
          component={VerifyScreen}
          options={{ title: 'Verify', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="Scan"
          component={ScanScreen}
          options={{ title: 'Scan', headerBackTitle: 'Back' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
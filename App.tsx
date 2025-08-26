// App.tsx (project root)
import 'react-native-gesture-handler';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';

import RootNavigator from './src/navigation/RootNavigator';
import { useSettings } from './src/hooks/useSettings';
import { theme } from './src/theme';

export default function App() {
  const { settings, loading } = useSettings();

  // Lightweight loading splash while settings initialize
  if (loading) {
    return (
      <SafeAreaProvider>
        <View
          style={{
            flex: 1,
            backgroundColor: theme.colors.bg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <StatusBar style="light" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <RootNavigator />
      <StatusBar style={settings.theme === 'dark' ? 'light' : 'dark'} />
    </SafeAreaProvider>
  );
}
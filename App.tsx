// App.tsx
import 'react-native-gesture-handler';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import RootNavigator from './src/navigation/RootNavigator';
import { useSettings } from './src/hooks/useSettings';
import { theme } from './src/theme';
import { View, ActivityIndicator } from 'react-native';

export default function App() {
  const { settings, loading } = useSettings();

  if (loading) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center', justifyContent: 'center' }}>
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
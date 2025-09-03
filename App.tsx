// App.tsx
import 'react-native-gesture-handler';
import React from 'react';
import { DefaultTheme, DarkTheme, NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { SettingsProvider, useSettings, resolveThemeName } from './src/SettingsProvider';

function AppInner() {
  const { settings } = useSettings();
  const mode = resolveThemeName(settings.theme);
  const theme = mode === 'dark' ? DarkTheme : DefaultTheme;
  return (
    <NavigationContainer theme={theme}>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <AppInner />
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
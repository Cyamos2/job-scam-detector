// App.tsx
import React from "react";
import { useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  NavigationContainer,
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavDefaultTheme,
} from "@react-navigation/native";

import RootNavigator from "./src/navigation/RootNavigator";
import { SettingsProvider, useSettings } from "./src/SettingsProvider";

function AppInner() {
  const { settings } = useSettings(); // settings.theme: "system" | "light" | "dark"
  const systemScheme = useColorScheme(); // "light" | "dark" | null

  const mode =
    settings.theme === "system" ? (systemScheme ?? "light") : settings.theme;

  const theme = mode === "dark" ? NavDarkTheme : NavDefaultTheme;

  return (
    <NavigationContainer theme={theme}>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
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
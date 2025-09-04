// App.tsx
import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  NavigationContainer,
  DefaultTheme as NavLight,
  DarkTheme as NavDark,
  Theme,
} from "@react-navigation/native";

import RootNavigator from "./src/navigation/RootNavigator";
import {
  SettingsProvider,
  useSettings,
  resolveThemeName,
} from "./src/SettingsProvider";

// Brand color
const ORANGE = "#FF5733";

// Light/Dark themes with nicer defaults
const LightTheme: Theme = {
  ...NavLight,
  colors: {
    ...NavLight.colors,
    primary: ORANGE,
    background: "#ffffff",
    card: "#ffffff",
    text: "#111111",
    border: "#E5E7EB",
    notification: NavLight.colors.notification,
  },
};

const DarkTheme: Theme = {
  ...NavDark,
  colors: {
    ...NavDark.colors,
    primary: ORANGE,
    background: "#0B0B0B",
    card: "#141414",
    text: "#FFFFFF",
    border: "#27272A",
    notification: NavDark.colors.notification,
  },
};

function AppInner() {
  const { settings } = useSettings();
  const mode = resolveThemeName(settings.theme);
  const theme = mode === "dark" ? DarkTheme : LightTheme; // (system -> Light fallback is fine in Expo 53)
  const barStyle = mode === "dark" ? "light" : "dark";

  return (
    <NavigationContainer theme={theme}>
      <StatusBar style={barStyle} />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SettingsProvider>
          <AppInner />
        </SettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
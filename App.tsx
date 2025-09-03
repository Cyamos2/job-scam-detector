// App.tsx
import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
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

// optional: keep your brand color in theme.primary
const ORANGE = "#FF5733";

// make colors a little nicer for both modes
const LightTheme: Theme = {
  ...NavLight,
  colors: {
    ...NavLight.colors,
    primary: ORANGE,
    background: "#ffffff",
    card: "#ffffff",
    text: "#111111",
    border: "#E5E7EB",
  },
};

const DarkTheme: Theme = {
  ...NavDark,
  colors: {
    ...NavDark.colors,
    primary: ORANGE,
    background: "#0B0B0B", // full-screen background
    card: "#141414",       // surfaces/cards/headers
    text: "#FFFFFF",
    border: "#27272A",
  },
};

function AppShell() {
  const { settings } = useSettings();
  const mode = resolveThemeName(settings.theme);
  const theme = mode === "dark" ? DarkTheme : mode === "light" ? LightTheme : LightTheme; // system->light fallback (Expo 53)
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
    <SafeAreaProvider>
      <SettingsProvider>
        <AppShell />
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
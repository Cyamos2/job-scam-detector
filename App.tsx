// App.tsx
import React from "react";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";

import RootNavigator from "./src/navigation/RootNavigator";
import { SettingsProvider, useSettings } from "./src/SettingsProvider";
import { SavedItemsProvider } from "./src/store/savedItems";

export default function App() {
  return (
    <SettingsProvider>
      <SavedItemsProvider>
        <NavigationThemeGate />
      </SavedItemsProvider>
    </SettingsProvider>
  );
}

// This component is INSIDE SettingsProvider, so useSettings works here
function NavigationThemeGate() {
  const { theme } = useSettings(); // ✅ now defined
  const navTheme = theme === "dark" ? DarkTheme : DefaultTheme;

  return (
    <>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <NavigationContainer theme={navTheme}>
        <RootNavigator />
      </NavigationContainer>
    </>
  );
}
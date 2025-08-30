// App.tsx
import React from "react";
import { StatusBar } from "react-native";
import { NavigationContainer, DarkTheme, DefaultTheme } from "@react-navigation/native";
import RootNavigator from "./src/navigation/RootNavigator";
import { useSettings, SettingsProvider } from "./src/SettingsProvider";
import { SavedItemsProvider } from "./src/store/savedItems";

function Shell() {
  const { theme } = useSettings();
  const navTheme = theme === "dark" ? DarkTheme : DefaultTheme;

  return (
    <>
      {/* ✅ Status bar adapts to theme */}
      <StatusBar
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={navTheme.colors.background}
      />
      <NavigationContainer theme={navTheme}>
        <RootNavigator />
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <SavedItemsProvider>
        <Shell />
      </SavedItemsProvider>
    </SettingsProvider>
  );
}
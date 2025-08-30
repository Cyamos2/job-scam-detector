// App.tsx
import React from "react";
import { NavigationContainer, DarkTheme, DefaultTheme } from "@react-navigation/native";
import RootNavigator from "./src/navigation/RootNavigator";
import { SettingsProvider, useSettings } from "./src/SettingsProvider";
import { SavedItemsProvider } from "./src/store/savedItems";

function Shell() {
  const { theme } = useSettings(); // "light" | "dark"
  const navTheme = theme === "dark" ? DarkTheme : DefaultTheme;

  return (
    <NavigationContainer theme={navTheme}>
      <RootNavigator />
    </NavigationContainer>
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
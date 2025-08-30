// App.tsx (root)
import React from "react";
import { NavigationContainer, DarkTheme, DefaultTheme } from "@react-navigation/native";
import RootNavigator from "./src/navigation/RootNavigator"; // ⬅ path fixed

import { SettingsProvider, useSettings } from "./src/SettingsProvider";
import { SavedItemsProvider } from "./src/store/savedItems";

// ...rest unchanged

function Shell() {
  const { theme } = useSettings();
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
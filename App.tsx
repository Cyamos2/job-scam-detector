import React from "react";
import { NavigationContainer, DarkTheme, DefaultTheme } from "@react-navigation/native";
import RootNavigator from "./navigation/RootNavigator";
import { SettingsProvider, useSettings } from "./SettingsProvider";
import { SavedItemsProvider } from "./store/savedItems";

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
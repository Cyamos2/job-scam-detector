// App.tsx
import * as React from "react";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import RootNavigator from "./src/navigation/RootNavigator";
import { SettingsProvider, useSettings } from "./src/SettingsProvider";
import { SavedItemsProvider } from "./src/store/savedItems";

function Shell() {
  // Read theme from Settings so nav theming follows Light/Dark
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
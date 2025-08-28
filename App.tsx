// App.tsx
import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import RootNavigator from "./src/navigation/RootNavigator";
import { SettingsProvider } from "./src/SettingsProvider";
import { SavedItemsProvider } from "./src/store/savedItems"; // 👈 this is the provider you pasted

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <SavedItemsProvider>
          <RootNavigator />
          <StatusBar style="auto" />
        </SavedItemsProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
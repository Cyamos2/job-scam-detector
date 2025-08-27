// App.tsx
import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import RootNavigator from "./src/navigation/RootNavigator";
import { SettingsProvider } from "./src/SettingsProvider";

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <RootNavigator />
        <StatusBar style="light" />
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
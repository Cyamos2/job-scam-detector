import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler"; // ⬅️ add

import RootNavigator from "./src/navigation/RootNavigator";
import { SettingsProvider } from "./src/SettingsProvider";
import { SavedItemsProvider } from "./src/store/savedItems";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>{/* ⬅️ wrap once */}
      <SafeAreaProvider>
        <SettingsProvider>
          <SavedItemsProvider>
            <RootNavigator />
            <StatusBar style="auto" />
          </SavedItemsProvider>
        </SettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
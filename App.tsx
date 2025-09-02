import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import RootNavigator from "./src/navigation/RootNavigator";
import { SettingsProvider } from "./src/SettingsProvider";
import { SavedItemsProvider } from "./src/store/savedItems";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SettingsProvider>
        <SavedItemsProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </SavedItemsProvider>
      </SettingsProvider>
    </GestureHandlerRootView>
  );
}
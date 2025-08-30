// src/navigation/RootNavigator.tsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

// These files already exist in your repo
import HomeStack from "./HomeStack";
import DatabaseStack from "./DatabaseStack";
import SettingsScreen from "../screens/SettingsScreen";

const Tab = createBottomTabNavigator();

/**
 * Tab names are important:
 * - "HomeTab" is used elsewhere (e.g., navigation.getParent()?.navigate("HomeTab", ...))
 * - "DatabaseTab" is used for cross-tab jumps from AddContent, etc.
 */
export default function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false, // stacks/screens manage their own headers
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{ title: "Home" }}
      />
      <Tab.Screen
        name="DatabaseTab"
        component={DatabaseStack}
        options={{ title: "Database" }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{ title: "Settings" }}
      />
    </Tab.Navigator>
  );
}
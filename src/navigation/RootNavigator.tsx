// src/navigation/RootNavigator.tsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeStack from "./HomeStack";
import DatabaseStack from "./DatabaseStack";
import SettingsStack from "./SettingsStack";

export type TabsParamList = {
  HomeTab: undefined;
  DatabaseTab: undefined;
  SettingsTab: undefined;
};

const Tab = createBottomTabNavigator<TabsParamList>();

export default function RootNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: "Home" }} />
      <Tab.Screen name="DatabaseTab" component={DatabaseStack} options={{ title: "Database" }} />
      <Tab.Screen name="SettingsTab" component={SettingsStack} options={{ title: "Settings" }} />
    </Tab.Navigator>
  );
}
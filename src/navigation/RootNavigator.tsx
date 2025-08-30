// src/navigation/RootNavigator.tsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeStack from "./HomeStack";
import DatabaseStack from "./DatabaseStack";
import SettingsScreen from "../screens/SettingsScreen";

export type RootTabsParamList = {
  HomeTab: undefined;
  DatabaseTab: undefined;
  SettingsTab: undefined;
};

const Tab = createBottomTabNavigator<RootTabsParamList>();

export default function RootNavigator() {
  return (
    <Tab.Navigator>
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
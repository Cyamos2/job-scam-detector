// src/navigation/useTabs.tsx
import React from "react";
import { NavigationContainer, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeStack from "./HomeStack";
import DatabaseStack from "./DatabaseStack";
import SettingsScreen from "../screens/SettingsScreen";
import { useSettings } from "../SettingsProvider";

type TabParamList = {
  HomeTab: undefined;
  DatabaseTab: undefined;
  SettingsTab: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export default function RootNavigator() {
  const { theme } = useSettings();
  const navTheme = theme === "dark" ? DarkTheme : DefaultTheme;

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator screenOptions={{ headerShown: true }}>
        <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: "Home" }} />
        <Tab.Screen name="DatabaseTab" component={DatabaseStack} options={{ title: "Database" }} />
        <Tab.Screen name="SettingsTab" component={SettingsScreen} options={{ title: "Settings" }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
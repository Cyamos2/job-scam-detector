// src/navigation/RootNavigator.tsx
import React, { useMemo } from "react";
import { NavigationContainer, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSettings } from "../SettingsProvider";

// TODO: replace with your actual screens
import HomeScreen from "../screens/HomeScreen";
import DatabaseScreen from "../screens/DatabaseScreen";
import SettingsScreen from "../screens/SettingsScreen";

const Tab = createBottomTabNavigator();

export default function RootNavigator() {
  const { theme } = useSettings();

  const navTheme = useMemo(
    () => (theme === "dark" ? DarkTheme : DefaultTheme),
    [theme]
  );

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator>
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Database" component={DatabaseScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
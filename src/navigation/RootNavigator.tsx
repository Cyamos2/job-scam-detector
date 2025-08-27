import React, { useMemo } from "react";
import { NavigationContainer, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSettings } from "../SettingsProvider";
import HomeStack from "./HomeStack";
import DatabaseScreen from "../screens/DatabaseScreen";
import SettingsScreen from "../screens/SettingsScreen";

const Tab = createBottomTabNavigator();

export default function RootNavigator() {
  const { theme } = useSettings();
  const navTheme = useMemo(() => (theme === "dark" ? DarkTheme : DefaultTheme), [theme]);

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator>
        <Tab.Screen
          name="HomeTab"
          component={HomeStack}
          options={{ headerShown: false, title: "Home" }}
        />
        <Tab.Screen name="Database" component={DatabaseScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}